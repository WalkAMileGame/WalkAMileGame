import { useState, useEffect } from "react";
import '../styles/Circumstancess.css';
import editIcon from '../styles/icons/editicon.png';
import deleteIcon from '../styles/icons/deleteicon.png';
import addIcon from '../styles/icons/addicon.png';
import { useAuth } from '../context/AuthContext';

const CircumstanceCard = ({ title, description, onEdit, onDelete }) => {
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
      <p className="note-description">{description}</p>
    </div>
  );
};

const Circumstances = () => {
  const [notes, setNotes] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { authFetch } = useAuth();

  useEffect(() => {
    const loadCircumstances = async () => {
      try {
        const res = await authFetch('/circumstances');
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
      const res = await authFetch('/save_circumstance', {
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
        <h1>EDIT CIRCUMSTANCES</h1>
      </div>

      <div className="description">
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
        <div className="note-area">
          {notes.map((note, i) => (
            <CircumstanceCard
              key={i}
              title={note.title}
              description={note.description}
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
