import { useState, useEffect } from "react";
import '../styles/Circumstancess.css';
import editIcon from '../styles/icons/editicon.png';
import deleteIcon from '../styles/icons/deleteicon.png';
import addIcon from '../styles/icons/addicon.png';
import { API_BASE } from "../api";

const CircumstanceCard = ({ title, content, onEdit, onDelete }) => {
  return (
    <div className="note-card">
      <img
        src={editIcon}
        alt="edit"
        className="edit-icon"
        onClick={onEdit}
        title="Edit"
      />
      <img
        src={deleteIcon}
        alt="delete"
        className="delete-icon"
        onClick={onDelete}
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
        <h1>EDIT CIRCUMSTANCES</h1>
      </div>

      <div className="content">
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
        <div className="note-area">
          {notes.map((note, i) => (
            <CircumstanceCard
              key={i}
              title={note.title}
              content={note.content}
              onEdit={() => openEditor(i)}
              onDelete={() => handleDelete(note)}
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
