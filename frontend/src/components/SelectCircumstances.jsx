import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // <- added
import '../styles/Circumstancess.css';
import editIcon from '../styles/icons/editicon.png';
import deleteIcon from '../styles/icons/deleteicon.png';
import addIcon from '../styles/icons/addicon.png';
import searchIcon from '../styles/icons/searchicon.png';
import acceptIcon from '../styles/icons/accepticon.png';
import { useAuth } from '../context/AuthContext';

const CircumstanceCard = ({ title, description, onEdit, onDelete, selected, onSelect }) => {
  return (
    <div
      className={`note-card-select-mode ${selected ? "selected" : ""}`}
      onClick={onSelect}
      title={selected ? "Selected" : "Select circumstance"}
    >
      <img
        src={editIcon}
        alt="edit"
        className="edit-icon"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title={selected ? "Selected" : "Select circumstance"}
      />
      <img
        src={deleteIcon}
        alt="delete"
        className="delete-icon"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete"
      />
      <h3 className="note-title">{title}</h3>
      <p className="note-description">{description}</p>
            {selected && (
        <img
          src={acceptIcon}
          alt="selected"
          className="accept-icon"
          title="Selected"
        />
      )}
    </div>
  );
};


const Circumstances = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state.config
  const initialCircumstances = config?.circumstances?.map(c => c.id) || [];

  const [notes, setNotes] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState(initialCircumstances);
  const [searchTerm, setSearchTerm] = useState("");

  const { authFetch } = useAuth();

    const handleAccept = () => {
      const selectedNotes = notes.filter(note => selectedNoteIds.includes(note.id));
      config.circumstances = selectedNotes

      navigate("/gameboard", { state: { boardConfig: config, settings: true } });  // nää saa useLocationin kautta
    };



  useEffect(() => {
    const loadCircumstances = async () => {
      try {
        const res = await authFetch(`/circumstances`);
        const data = await res.json();
        
        const formatted = data.map(c => ({
        id: c._id,
        title: c.title,
        description: c.description
        }));

        setNotes(formatted);
      } catch (err) {
        console.error("Failed to fetch circumstances:", err);
      }
    };

    loadCircumstances();
  }, []);

  const openEditor = (i) => {
    setEditingIndex(i);
    setEditTitle(notes[i].title);
    setEditDescription(notes[i].description);
  };

const saveEdit = async () => {
  if (isAdding) {
    // Create new note
    try {
      const res = await authFetch(`/save_circumstance`, {
        method: "POST",
        body: JSON.stringify({
          id: '',
          title: editTitle,
          description: editDescription
        })
      });

      const newNote = await res.json(); 

      setNotes(prev => [...prev, { 
        id: newNote._id, 
        title: newNote.title, 
        description: newNote.description 
      }]);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  } else {
    // edit existing note
    const updated = [...notes];
    updated[editingIndex] = { title: editTitle, description: editDescription, id: notes[editingIndex].id };
    setNotes(updated);

    try {
      await authFetch(`/save_circumstance/${notes[editingIndex].id}`, {
        method: "PUT",
        body: JSON.stringify({
          id: '',
          title: editTitle,
          description: editDescription
        })
      });
    } catch (err) {
      console.error("Failed to save:", err);
    }
  }

  setEditingIndex(null);
  setIsAdding(false);
};


const handleDelete = async (note) => {
  if (!window.confirm(`Are you sure you want to delete circumstance "${note.title}"?`)) return;

  try {
    await authFetch(`/circumstance/${note.id}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.id !== note.id));
  } catch (err) {
    console.error("Failed to delete circumstance:", err);
  }
};



  return (
    
    <div className="circumstance-page">
      <div className="circumstance-header">
        <h1>SELECT CIRCUMSTANCES</h1>
      </div>

      <div className="select-cicrumstances-description">
        <div className="search-bar-container">
        <input
            type="text"
            placeholder="Search for circumstances..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
            backgroundImage: `url(${searchIcon})`,
            backgroundPosition: "15px 12px",
            backgroundRepeat: "no-repeat",
            backgroundSize: "18px 18px",
            }}
        />
        <button title="Return with selections"onClick={handleAccept}>Done</button>
        <button title="Return without selections"onClick={() => navigate("/gameboard", { state: { boardConfig: config, settings: true } })}>Cancel</button>
        </div>
        <img
        src={addIcon}
        alt="add"
        className="add-icon"
        onClick={() => {
            setIsAdding(true);
            setEditTitle("");
            setEditDescription("");
            setEditingIndex(null); 
        }}
        title="Add new circumstance"
      />
        <div className="select-circumstance-note-area">
          {notes.map((note, i) => (
            <CircumstanceCard
              key={i}
              title={note.title}
              description={note.description}
              onEdit={() => openEditor(i)}
              onDelete={() => handleDelete(note)}
              onSelect={() => setSelectedNoteIds(prev => prev.includes(note.id) ? prev.filter(id => id !== note.id) : [...prev, note.id])}
              selected={selectedNoteIds.includes(note.id)}
            />
          ))}
        </div>
      </div>

        {(editingIndex !== null || isAdding) && (
        <div className="modal-backdrop">
            <div className="modal">
            <h2>{isAdding ? "Add new circumstance" : "Edit circumstance"}</h2>

            <label htmlFor="edit-title">Title</label>
            <input 
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
            />

            <label htmlFor="edit-description">Description</label>
            <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
            />

            <div className="modal-buttons">
                <button className="savebtn" onClick={saveEdit}>Save</button>
                <button className="cancelbtn" onClick={() => {
                setEditingIndex(null);
                setIsAdding(false);
                }}>Cancel</button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
};

export default Circumstances;
