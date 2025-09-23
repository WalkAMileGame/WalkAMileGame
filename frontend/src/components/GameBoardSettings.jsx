import React, { useState, useEffect } from "react";



const ColorPicker = ({ value, onChange, colors = [] }) => {
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

const GameBoardSettings = ({ gameConfig, onConfigChange, onSave, isVisible }) => {
  const [localConfig, setLocalConfig] = useState(gameConfig);
  const [templates, setTemplates] = useState([]);
  const [savedGameboards, setSavedGameboards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  };

  const handleNameChange = (value) => {
    const updatedConfig = { ...localConfig, name: value };
    setLocalConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };

  const handleSliceTextChange = (layerIndex, labelIndex, text) => {
    const updatedConfig = { ...localConfig };
    updatedConfig.ringData[layerIndex].labels[labelIndex].text = text;
    setLocalConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };

  const handleSliceColorChange = (layerIndex, labelIndex, color) => {
    const updatedConfig = { ...localConfig };
    updatedConfig.ringData[layerIndex].labels[labelIndex].color = color;
    setLocalConfig(updatedConfig);
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
    onConfigChange(updatedConfig);
  };

  const removeSlice = (layerIndex, labelIndex) => {
    const updatedConfig = { ...localConfig };
    updatedConfig.ringData[layerIndex].labels.splice(labelIndex, 1);
    setLocalConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };

  const loadSavedGameboard = async (gameboardId) => {
    console.log("load saved gameboard")
  };

  const handleSave = async () => {
    if (!localConfig.name?.trim()) {
        console.log("saving a new gameboard")
    }

    setIsSaving(true);
    try {
      await onSave(localConfig);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible) return null;




  return (
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
        <h3 className="text-lg">Templates</h3>
        {isLoading ? (
          <p>Loading templates...</p>
        ) : (
          <select onChange={(e) => console.log("loadTemplate", e.target.value)} className="w-full border rounded p-2">
            <option>Choose a template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        )}

        {/* Layers */}
        <h3 className="text-lg">Layer Configuration</h3>
        {localConfig.ringData?.map((ring, ringIndex) => (
          <div key={ring.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-700">
                Layer {ring.id} ({ring.labels.length} slices)
              </h4>
              <button
                onClick={() => addSlice(ringIndex)}
                className="px-2 py-1 bg-blue-500 text-white rounded"
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
            onClick={handleSave}
            disabled={isSaving || !localConfig.name?.trim()}
            className="w-full bg-green-500 text-white py-2 rounded"
          >
            {isSaving ? "Saving..." : "Save Gameboard"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameBoardSettings;