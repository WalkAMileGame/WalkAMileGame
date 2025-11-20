import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <- added
import '../styles/Circumstancess.css';
import editIcon from '../styles/icons/editicon.png';
import deleteIcon from '../styles/icons/deleteicon.png';
import addIcon from '../styles/icons/addicon.png';
import searchIcon from '../styles/icons/searchicon.png';
import { API_BASE } from "../api";

const CircumstanceCard = ({ title, content, onEdit, onDelete, selected, onSelect }) => {
  return (
    <div
      className={`note-card-select-mode ${selected ? "selected" : ""}`}
      onClick={onSelect}
      title="Select circumstance"
    >
      <img
        src={editIcon}
        alt="edit"
        className="edit-icon"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Edit"
      />
      <img
        src={deleteIcon}
        alt="delete"
        className="delete-icon"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete"
      />
      <h3 className="note-title">{title}</h3>
      <p className="note-content">{content}</p>
    </div>
  );
};


const Circumstances = () => {
  const [notes, setNotes] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

    const handleAccept = () => {
    const selectedNotes = notes.filter(note => selectedNoteIds.includes(note.id));
    navigate("/gameboard", { state: { selectedCircumstances: selectedNotes } });  // nää saa useLocationin kautta
    };

    const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const loadCircumstances = async () => {
      try {
        const res = await fetch(`${API_BASE}/circumstances`);
        const data = await res.json();
        
        const formatted = data.map(c => ({
        id: c._id, 
        title: c.name,
        content: c.description
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
    setEditContent(notes[i].content);
  };

const saveEdit = async () => {
  if (isAdding) {
    // Create new note
    try {
      const res = await fetch(`${API_BASE}/save_circumstance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTitle,
          description: editContent
        })
      });

      const newNote = await res.json(); 

      setNotes(prev => [...prev, { 
        id: newNote._id, 
        title: newNote.name, 
        content: newNote.description 
      }]);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  } else {
    // edit existing note
    const updated = [...notes];
    updated[editingIndex] = { title: editTitle, content: editContent, id: notes[editingIndex].id };
    setNotes(updated);

    try {
      await fetch(`${API_BASE}/save_circumstance/${notes[editingIndex].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTitle,
          description: editContent
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
    await fetch(`${API_BASE}/circumstance/${note.id}`, { method: "DELETE" });
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

      <div className="select-cicrumstances-content">
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
        <button title="Return without selections"onClick={() => navigate("/gameboard")}>Cancel</button>
        </div>
        <img
        src={addIcon}
        alt="add"
        className="add-icon"
        onClick={() => {
            setIsAdding(true);
            setEditTitle("");
            setEditContent("");
            setEditingIndex(null); 
        }}
        title="Add new circumstance"
      />
        <div className="select-circumstance-note-area">
          {filteredNotes.map((note, i) => (
            <CircumstanceCard
              key={i}
              title={note.title}
              content={note.content}
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

            <label htmlFor="edit-content">Content</label>
            <textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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
