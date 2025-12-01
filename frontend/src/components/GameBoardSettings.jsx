import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/GameboardSettings.css';
import Snackbar from "./ui/snackbar"
import { useAuth } from '../context/AuthContext';

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

const CircumstancePicker = ({ onChange, selected, circumstances = [] }) => {
  const handleToggle = (name) => {
    let updated;

    if (selected.includes(name)) {
      updated = selected.filter((item) => item !== name);
    } else {
      updated = [...selected, name]
    }

    onChange(updated)
  }

  return (
    <div className="circumstance-picker">
      {circumstances.map((circumstance) => (
        <label key={circumstance.title} className="checkbox-option">
          <input
            type="checkbox"
            className="circumstance-boxes"
            checked={selected.includes(circumstance.title)}
            onChange={() => handleToggle(circumstance.title)}
          />
          {circumstance.title}
        </label>
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
  const navigate = useNavigate()

  const [localConfig, setLocalConfig] = useState(gameConfig);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const { user, authFetch } = useAuth();
  
  useEffect(() => {
    setLocalConfig(gameConfig);
  }, [gameConfig]);

  useEffect(() => {
    if (isVisible) {
      loadGameboards();
    }
  }, [isVisible]);

  const loadGameboards = async () => {
    try {
      setIsLoading(true);
      console.log("loading gamebords");
      const res = await authFetch(`/load_boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })
      });
      if (!res.ok) {
        throw new Error("Failed to fetch boards");
      }
      
      const data = await res.json();
      setTemplates(data ?? []);
      
      console.log("loading complete");
    } catch (err) {
      console.error("Error loading gameboards:", err);
    } finally {
      setIsLoading(false);
    }
    
  };

  const handleCircumstances = () => {
    navigate("/select_circumstances", { state: { config: localConfig } });
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
  };

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

  const handleSliceCircumstanceChange = (layerIndex, labelIndex, required) => {
    const updatedConfig = { ...localConfig };
    updatedConfig.ringData[layerIndex].labels[labelIndex].required_for = required;
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig);
  };

  const handleTileTypeChange = (layerIndex, labelIndex, isTitleTile) => {
    const updatedConfig = { ...localConfig };
    const ring = updatedConfig.ringData[layerIndex];

    if (isTitleTile) {
      // Create a new title tile and insert at the beginning
      const newTitleId = ring.labels.length > 0 ? Math.max(...ring.labels.map(s => s.id)) + 1 : 1;
      const newTitleTile = {
        id: newTitleId,
        text: TitleNames[layerIndex],
        color: '#FFFFFF',
        energyvalue: 0,
        energypoint: false,
        tileType: 'ring_title'
      };
      ring.labels.unshift(newTitleTile);
    } else {
      // Remove the title tile (first tile if it's a title)
      if (ring.labels[0]?.tileType === 'ring_title') {
        ring.labels.shift();
      }
    }

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
      energypoint: false,
      tileType: 'action'
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
  const boardContent = {
    name: localConfig.name?.trim(),
    ringData: localConfig.ringData,
    circumstances: localConfig.circumstances
  }
  return authFetch(`/save_board`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      board: boardContent
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
  return authFetch(`/delete`, {
    method: "DELETE",
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

            const newValue = e.target.value;

            if (unsavedChanges) {
              const confirmBox = window.confirm(
                `Unsaved changes will be discarded. Are you sure you want to proceed?`
              )
              if (!confirmBox) {
                e.target.value = selectedTemplateName;
                return;
              }
            }
            setSelectedTemplateName(newValue)
            const selectedTemplate = templates.find(t => t.name === newValue)
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
        {/* Edit Circumstances */}

        <div className="pt-4 border-t">
          <button
            onClick={() => {
              handleCircumstances()
            }}
            className="edit-button"
          >
            Edit Circumstances
          </button>
        </div>

        {/* Layers */}
        <h3 className="layeredit-title">Edit layers and buttons</h3>
        {localConfig.ringData?.map((ring, ringIndex) => (
          <div key={ring.id} className="border rounded-lg p-4">
              <hr></hr>
              <div className="layerinfo-container">
                <h4 className="layerinfo-title">
                  {TitleNames[ringIndex]} ({ring.labels.filter(l => l.tileType !== 'ring_title').length} slices)
                </h4>
                <button
                  onClick={() => addSlice(ringIndex)}
                  className="addslice-button"
                >
                  + Add Slice
                </button>
              </div>

            {/* Ring Title Section */}
            {ring.labels[0] && (
              <div className="ring-title-section">
                <div className="flex items-center gap-2 mb-2">
                  {ring.labels[0].tileType === 'ring_title' && (
                    <input
                      value={ring.labels[0].text}
                      onChange={(e) => handleSliceTextChange(ringIndex, 0, e.target.value)}
                      className="labelname-input"
                      placeholder="Ring title text"
                    />
                  )}
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ring.labels[0].tileType === 'ring_title'}
                      onChange={(e) => handleTileTypeChange(ringIndex, 0, e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span className="ring-title-label">Enable ring title</span>
                  </label>
                </div>
                {ring.labels[0].tileType === 'ring_title' && (
                  <ColorPicker
                    value={ring.labels[0].color}
                    colors={['#FFFFFF', ...LayerColors[ringIndex]]}
                    onChange={(color) => handleSliceColorChange(ringIndex, 0, color)}
                  />
                )}
              </div>
            )}

            {/* Regular Slices Section */}
            <div className="space-y-3">
              {ring.labels.map((label, labelIndex) => {
                if (label.tileType === 'ring_title') return null;
                return (
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
                        title = "Remove this slice"
                      >
                        ✕
                      </button>
                    </div>
                    <ColorPicker
                      value={label.color}
                      colors={LayerColors[ringIndex]}
                      onChange={(color) => handleSliceColorChange(ringIndex, labelIndex, color)}
                    />
                    <CircumstancePicker
                      circumstances={localConfig.circumstances}
                      selected={localConfig.ringData[ringIndex]?.labels[labelIndex]?.required_for ?? []}
                      onChange={(required) => handleSliceCircumstanceChange(ringIndex, labelIndex, required)}
                    />
                  </div>
                );
              })}
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

