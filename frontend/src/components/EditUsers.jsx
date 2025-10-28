import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import '../styles/EditUsers.css';
import Snackbar from "./ui/snackbar"

const placeHolderUsers = [
    { email: "pertti@testi.fi", role: "gamemaster" },
    { email: "jaska@testi.fi", role: "gamemaster" },
    { email: "pekka@testi.fi", role: "gamemaster" },
    { email: "kalle@testi.fi", role: "gamemaster" },
    { email: "janne@testi.fi", role: "gamemaster" },
    { email: "sanna@testi.fi", role: "gamemaster" }
]

const EditUsers = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedOption, setSelectedOption] = useState("Gamemaster");
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [pendingUsers, setPendingUsers] = useState([])
    const [existingUsers, setExistingUsers] = useState([])

    useEffect(() => {
        setExistingUsers(placeHolderUsers);
      }, [placeHolderUsers]);

    const handleAdd = async () => {
        if (!inputValue.trim()) {
            setSnackbarMessage("Please enter an email.");
            setShowSnackbar(true);
            return;
        }

        setIsSaving(true);
        try {
            const response = await addUser();
            if (response.ok) {
                setPendingUsers([...pendingUsers, {email: inputValue, role: selectedOption}]);
            }

            if (!response.ok) {
                let errorMsg = "Failed to add user.";
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

            setSnackbarMessage("User added successfully!");
            setShowSnackbar(true);
        } catch (err) {
            console.error("Save failed:", err);
            setSnackbarMessage("Failed to save gameboard (network error).");
            setShowSnackbar(true);
        } finally {
            setIsSaving(false)
        }

        console.log("Input:", inputValue);
        console.log("Checkbox:", selectedOption);
        
        setShowPopup(false);
        setInputValue("");
    };

    const addUser = () => {
        return fetch("http://localhost:8000/add_user", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: inputValue.trim(),
                role: selectedOption
            })
        });
    };

    return (
      <>
      <Snackbar
        message={snackbarMessage}
        show={showSnackbar}
        onClose={() => setShowSnackbar(false)}
      />

      <div className="edit-page">
        <div className="existing-users">
          <h1>Existing users</h1>
          <div className="user-boxes">
            {existingUsers.map((user, index) => (
            <button className="user-box" key={index}>
              {user.email}, {user.role}
            </button>
            ))}
          </div>
        </div>
        <div className="pending-users">
          <h1>Pending users</h1>
          <button className="add-button" onClick={() => setShowPopup(true)}>
            Add user
          </button>
          <div className="user-boxes">
            {pendingUsers.map((user, index) => (
            <button className="user-box" key={index}>
              {user.email}, {user.role}
            </button>
            ))}
          </div>
        </div>

        {/* Popup */}
        {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Enter Email</h2>
            
            <label>
              Email:
              <input
                type="email"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </label>

            <div className="options">
              <p>Select a role:</p>

              <label>
                <input
                  type="radio"
                  name="choice"
                  value="Admin"
                  checked={selectedOption === "Admin"}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                Admin
              </label>

              <label>
                <input
                  type="radio"
                  name="choice"
                  value="Gamemaster"
                  checked={selectedOption === "Gamemaster"}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                Gamemaster
              </label>
            </div>

            <div className="buttons">
              <button onClick={handleAdd}>Add</button>
              <button onClick={() => {setShowPopup(false), setInputValue("")}}>Cancel</button>
            </div>
          </div>
        </div>
        )}
      </div>
      </>
    );
};

export default EditUsers
