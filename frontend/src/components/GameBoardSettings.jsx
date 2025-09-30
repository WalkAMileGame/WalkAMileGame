import React, { useState, useEffect } from "react";
import Snackbar from "./ui/snackbar"


        {/* Available colors */}
const ColorPicker = ({ onChange, colors = [] }) => {
  const defaultColors = [
    "#ffc072", "#ffb088", "#d79543", "#e17f4d", "#a3d7ff", "#a0b8ca", "#d3eafc",
    "#bb98d5", "#a872d1", "#e4c1ff", "#5375d0", "#9fb9ff", "#7e9ef3", "#7892d8",
    "#89bd8d", "#89b38d", "#659d69", "#da6363", "#ff8989", "#da8a8a"
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

const GameBoardSettings = ({ gameConfig, onConfigChange, isVisible }) => {
  const [localConfig, setLocalConfig] = useState(gameConfig);
  const [templates, setTemplates] = useState([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    fetch("http://localhost:8000/load_all")
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
      color: '#6b7280'
    });
    
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig);
  };

  const removeSlice = (layerIndex, labelIndex) => {
    const updatedConfig = { ...localConfig };
    updatedConfig.ringData[layerIndex].labels.splice(labelIndex, 1);
    setLocalConfig(updatedConfig);
    setUnsavedChanges(true);
    onConfigChange(updatedConfig);
  };

  const loadSavedGameboard = async (boardData) => {
    setLocalConfig(boardData);
    setUnsavedChanges(false);
    onConfigChange(boardData);
    console.log("load saved gameboard");
  };

const handleSave = async () => {
  if (!localConfig.name?.trim()) {
    setSnackbarMessage("Please enter a name before saving.");
    setShowSnackbar(true);
    return; 
  }

  setIsSaving(true);
  try {
    const response = await saveGameboard();
    if (response.ok) {setUnsavedChanges(false);}

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
  return fetch("http://localhost:8000/save", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      name: localConfig.name?.trim(), 
      ringData: localConfig.ringData 
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
          <select onChange={(e) => {
            if (unsavedChanges) {
              const confirmBox = window.confirm(
                `Unsaved changes will be discarded. Are you sure you want to proceed?`
              )
              if (!confirmBox) {return}
            }
            const selectedTemplate = templates.find(t => t.name === e.target.value)
            if (selectedTemplate) {
              loadSavedGameboard(selectedTemplate)
            }
          }} className="template-dropdown">
            <option>Choose a template</option>
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
                  Layer {ring.id} ({ring.labels.length} slices)
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
                    <button
                      onClick={() => removeSlice(ringIndex, labelIndex)}
                      className="deleteslice-button"
                    >
                      ✕
                    </button>
                  </div>
                  <ColorPicker
                    value={label.color}
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
              if (templates.find(t => t.name === localConfig.name?.trim())) {
                const confirmBox = window.confirm(
                  `Are you sure you want to overwrite ${localConfig.name?.trim()}?`
                )
                if (!confirmBox) {return}
              }
              handleSave()
            }}
            disabled={isSaving}
            // disabled={isSaving || !localConfig.name?.trim()}
            className="save-button"
          >
            {isSaving ? "Saving..." : "Save Gameboard"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default GameBoardSettings;

