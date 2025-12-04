import { useState, useEffect } from "react";
import '../styles/Circumstancess.css';
import editIcon from '../styles/icons/editicon.png';
import deleteIcon from '../styles/icons/deleteicon.png';
import addIcon from '../styles/icons/addicon.png';
import { useAuth } from '../context/AuthContext';
import Snackbar from "./ui/snackbar"

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
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const MaxTitle = 60
  const MaxDescription = 450

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
  const CheckIfTitleExists = notes.find(
    (note,index) => 
      note.title.trim().toLowerCase() === editTitle.trim().toLowerCase() &&
      index !== editingIndex
  );
  if (CheckIfTitleExists) {
    setSnackbarMessage(`Note with a title ${CheckIfTitleExists.title} already exists`);
    setShowSnackbar(true);     
    return;
  }

  if (editTitle.length > 60) {
    setSnackbarMessage("Title must be less than 60 characters");
    setShowSnackbar(true);     
    return;
  }

    if (editDescription.length > 450) {
    setSnackbarMessage("Description must be less than 450 characters");
    setShowSnackbar(true);     
    return;
  }


  if (isAdding) {
    // Create new note
    try {
      const res = await authFetch('/save_circumstance', {
        method: "POST",
        body: JSON.stringify({
          title: editTitle,
          description: editDescription
        })
      });

      const newNote = await res.json(); 

      setNotes(prev => [...prev, { 
        id: newNote._id,
        title: newNote.title,
        description: newNote.description,
        author: newNote.author
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
    const response = await authFetch(`/circumstance/${note.id}`, { method: "DELETE" });
    if (response.ok) {
      setNotes(prev => prev.filter(n => n.id !== note.id));
    }

    if (!response.ok) {
      let errorMsg = "Failed to delete circumstance.";
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
    
  } catch (err) {
    console.error("Failed to delete circumstance:", err);
  }
};



  return (
    
    <div className="circumstance-page">
        <Snackbar
        message={snackbarMessage}
        show={showSnackbar}
        onClose={() => setShowSnackbar(false)}
    />
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
                maxLength={MaxTitle}
            />
            <div className={`char-counter ${editTitle.length > MaxTitle - 5 ? "warning" : ""}`}>
              {editTitle.length}/{MaxTitle}
            </div>

            <label htmlFor="edit-description">Description</label>
            <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={MaxDescription}
            />
            <div className={`char-counter ${editDescription.length > MaxDescription - 5 ? "warning" : ""}`}>
              {editDescription.length}/{MaxDescription}
              </div>

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
