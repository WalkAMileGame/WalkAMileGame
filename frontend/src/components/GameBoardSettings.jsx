import React, { useState, useEffect } from "react";
import '../styles/GameboardSettings.css';
import Snackbar from "./ui/snackbar"
import { API_BASE } from "../api";

        {/* Available colors */}
const ColorPicker = ({ onChange, colors = [] }) => {
  const defaultColors = [
    "#ffc072", "#ffb088", "#a3d7ff", "#d3eafc", "#a872d1", "#e4c1ff", "#da6363", "#da8a8a"
  ];
  
  const availableColors = colors.length > 0 ? colors : defaultColors;
  
  return (
    <div className="color picker">
      {availableColors.map((color) => (
        <button
          key={color}
          type="button"
          className="colorbuttons"
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
};

const LayerColors = [
    ["#ffc072", "#ffb088"],
    ["#a3d7ff", "#d3eafc"],
    ["#a872d1", "#e4c1ff"],
    ["#da6363", "#da8a8a"]
  ]

const TitleNames = ["MOVING", "MOVING", "ARRIVING", "THRIVING"]

const GameBoardSettings = ({ gameConfig, onConfigChange, isVisible }) => {
  const [localConfig, setLocalConfig] = useState(gameConfig);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    setLocalConfig(gameConfig);
  }, [gameConfig]);

  useEffect(() => {
    if (isVisible) {
      loadGameboards();
    }
  }, [isVisible]);

  const loadGameboards = async () => {
    setIsLoading(true);
    console.log("loading gamebords")
    fetch(`${API_BASE}/load_all`)
      .then((res) => res.json())
      .then((data) => setTemplates(data));
    setIsLoading(false);
    console.log("loading complete")
  };

  const handleNameChange = (value) => {
    const updatedConfig = { ...localConfig, name: value };
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig);
  };

  const handleEnergyvalueChange = (layerIndex, labelIndex, energyvalue) => {
    const updatedConfig = { ...localConfig };
    updatedConfig.ringData[layerIndex].labels[labelIndex].energyvalue = energyvalue;
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig)
  }

  const handleSliceTextChange = (layerIndex, labelIndex, text) => {
    const updatedConfig = { ...localConfig };
    updatedConfig.ringData[layerIndex].labels[labelIndex].text = text;
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig);
  };

  const handleSliceColorChange = (layerIndex, labelIndex, color) => {
    const updatedConfig = { ...localConfig };
    updatedConfig.ringData[layerIndex].labels[labelIndex].color = color;
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig);
  };

  const addSlice = (layerIndex) => {
    const updatedConfig = { ...localConfig };
    const ring = updatedConfig.ringData[layerIndex];
    const newLabelId = Math.max(...ring.labels.map(s => s.id)) + 1;


    ring.labels.push({
      id: newLabelId,
      text: `New Action ${newLabelId}`,
      color: '#6b7280',
      energyvalue: 1,
      energypoint: false
    });
    
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig);
  };

  const removeSlice = (layerIndex, labelIndex) => {
    const updatedConfig = { ...localConfig };

    if (updatedConfig.ringData[layerIndex].labels.length > 2) {
    updatedConfig.ringData[layerIndex].labels.splice(labelIndex, 1);
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig);
    } else {
    setSnackbarMessage("Each ring must have at least two labels");
    setShowSnackbar(true);      
    }
  };

const loadSavedGameboard = async (boardData) => {
  const normalisedData = {
    ...boardData,
    ringData: boardData.ringData.map((ring) => ({
      ...ring, 
      labels: ring.labels.map((label) => ({
        ...label, 
        energyvalue: label.energyvalue ?? 1, // add default if missing
        energypoint: label.energypoint ?? false
      })),
    })),
  };

  setLocalConfig(normalisedData);
  setUnsavedChanges(false);
  onConfigChange(normalisedData);
};


const handleSave = async () => {
  if (!localConfig.name?.trim()) {
    setSnackbarMessage("Please enter a name before saving.");
    setShowSnackbar(true);
    return; 
  }

  if (templates.find(t => t.name === localConfig.name?.trim())) {
    const confirmBox = window.confirm(
      `Are you sure you want to overwrite ${localConfig.name?.trim()}?`
      )
    if (!confirmBox) {
      setSnackbarMessage("Saving aborted");
      setShowSnackbar(true);
      return;
    }
  }

  setIsSaving(true);
  try {
    const response = await saveGameboard();
    if (response.ok) {
      setUnsavedChanges(false);
      if (templates.find(t => t.name === localConfig.name?.trim())) {
        const updatedTemplates = templates.map(t =>
        t.name === localConfig.name?.trim()
          ? { ...t, ringData: localConfig.ringData } : t
        );
        setTemplates(updatedTemplates)
      } else {
        const updatedTemplates = [...templates, localConfig];
        setTemplates(updatedTemplates);
      }
    }

    if (!response.ok) {
      let errorMsg = "Failed to save gameboard.";
      try {
        const data = await response.json();
        if (data?.error) {
          errorMsg = ` ${data.error}`;
        }
      } catch {
        // ignore JSON parse errors
      }
      setSnackbarMessage(errorMsg);
      setShowSnackbar(true);
      return;
    }

    setSnackbarMessage("Gameboard saved successfully!");
    setShowSnackbar(true);

  } catch (err) {
    console.error("Save failed:", err);
    setSnackbarMessage("Failed to save gameboard (network error).");
    setShowSnackbar(true);
  } finally {
    setIsSaving(false);
  }
};

{/* Make sure saveGameboard RETURNS the fetch result */ }
const saveGameboard = () => {
  return fetch(`${API_BASE}/save`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      name: localConfig.name?.trim(), 
      ringData: localConfig.ringData 
    }),
  });
};

const handleDelete = async () => {
  if (!localConfig.name?.trim()) {
    setSnackbarMessage("Please enter the name of the board you wish to delete.");
    setShowSnackbar(true);
    return; 
  }

  if (!templates.find(t => t.name === localConfig.name?.trim())) {
    setSnackbarMessage("No board with given name exists.");
    setShowSnackbar(true);
    return; 
  }

  const confirmBox = window.confirm(
    `Are you sure you want to delete ${localConfig.name?.trim()}?`
    )
  if (!confirmBox) {
    setSnackbarMessage("Delete aborted");
    setShowSnackbar(true);
    return;
  }

  setIsDeleting(true);
  try {
    const response = await deleteGameboard();
    if (response.ok) {
      setUnsavedChanges(false);
      const updatedTemplates = templates.filter(t => t.name !== localConfig.name?.trim());
      setTemplates(updatedTemplates);
    }

    if (!response.ok) {
      let errorMsg = "Failed to delete gameboard.";
      try {
        const data = await response.json();
        if (data?.error) {
          errorMsg = ` ${data.error}`;
        }
      } catch {
        // ignore JSON parse errors
      }
      setSnackbarMessage(errorMsg);
      setShowSnackbar(true);
      return;
    }

    setSnackbarMessage("Gameboard deleted successfully!");
    setShowSnackbar(true);

  } catch (err) {
    console.error("Delete failed:", err);
    setSnackbarMessage("Failed to delete gameboard (network error).");
    setShowSnackbar(true);
  } finally {
    setIsDeleting(false);
  }
};

const deleteGameboard = () => {
  return fetch(`${API_BASE}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      name: localConfig.name?.trim(), 
    }),
  });
};

  return (
    <>
       <Snackbar
        message={snackbarMessage}
        show={showSnackbar}
        onClose={() => setShowSnackbar(false)}
    />
    <div className="w-96 bg-white rounded-xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
      <div className="space-y-6">
        <div className="settingstext">
          <h2 className="text-2xl font-bold text-black mb-2">Edit gameboard</h2>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="gbname-text">Gameboard Name*: </label>
            <input
              id="name"
              value={localConfig.name || ""}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter gameboard name"
              className="gbname-input"
            />
          </div>
        </div>

        {/* Templates */}
        <div className="templates">
        <div className="loadgameboard-title">Load gameboards: </div>
        {isLoading ? (
          <p className="isloading">Loading templates...</p>
        ) : (
          <select 
          value={selectedTemplateName}
          onChange={(e) => {
            if (unsavedChanges) {
              const confirmBox = window.confirm(
                `Unsaved changes will be discarded. Are you sure you want to proceed?`
              )
              if (!confirmBox) {return}
            }
            setSelectedTemplateName(e.target.value)
            const selectedTemplate = templates.find(t => t.name === e.target.value)
            if (selectedTemplate) {
              const clonedTemplate = structuredClone(selectedTemplate);
              loadSavedGameboard(clonedTemplate);
            }
          }} className="template-dropdown">
            <option value="" disabled >Choose a template</option>
            {templates.map((template) => (
              <option key={template.name} value={template.name}>
                {template.name}
              </option>
            ))}
          </select>
        )}
        </div>

        {/* Layers */}
        <h3 className="layeredit-title">Edit layers and buttons</h3>
        {localConfig.ringData?.map((ring, ringIndex) => (
          <div key={ring.id} className="border rounded-lg p-4">
              <hr></hr>
              <div className="layerinfo-container">
                <h4 className="layerinfo-title">
                  {TitleNames[ringIndex]} ({ring.labels.length} slices)
                </h4>
                <button
                  onClick={() => addSlice(ringIndex)}
                  className="addslice-button"
                >
                  + Add Slice
                </button>
              </div>

            <div className="space-y-3">
              {ring.labels.map((label, labelIndex) => (
                <div key={label.id} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={label.text}
                      onChange={(e) => handleSliceTextChange(ringIndex, labelIndex, e.target.value)}
                      className="labelname-input"
                      placeholder="Slice text"
                    />
                    <span className="energypoint-text">
                    Energypoint value:
                    </span>
                    <input
                      data-testid={`energyvalue-input-${label.id}`}
                      value={label.energyvalue}
                      onChange={(e) => handleEnergyvalueChange(ringIndex, labelIndex, e.target.value)}
                      className="energyvalue-input"
                    />
                    <button
                      onClick={() => removeSlice(ringIndex, labelIndex)}
                      className="deleteslice-button"
                    >
                      ✕
                    </button>
                  </div>
                  <ColorPicker
                    value={label.color}
                    colors={LayerColors[ringIndex]}
                    onChange={(color) => handleSliceColorChange(ringIndex, labelIndex, color)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Save */}
        <div className="pt-4 border-t">
          <button
            onClick={() => {
              handleSave()
            }}
            disabled={isSaving}
            // disabled={isSaving || !localConfig.name?.trim()}
            className="save-button"
          >
            {isSaving ? "Saving..." : "Save Gameboard"}
          </button>
          {/* Delete */}
          <button
            onClick={() => {
              handleDelete()
            }}
            disabled={isDeleting}
            // disabled={isSaving || !localConfig.name?.trim()}
            className="delete-button"
          >
            {isDeleting ? "Deleting..." : "Delete Gameboard"}
          </button>
        </div>        
      </div>
    </div>
    </>
  );
};

export default GameBoardSettings;

