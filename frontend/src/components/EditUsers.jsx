import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import '../styles/EditUsers.css';
import Snackbar from "./ui/snackbar"
import { API_BASE } from "../api";

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
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedOption, setSelectedOption] = useState("gamemaster");
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false)
    const [pendingUsers, setPendingUsers] = useState([])
    const [existingUsers, setExistingUsers] = useState([])

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            console.log("loading users");
            const res = await fetch(`${API_BASE}/load_users`);
            const data = await res.json();
            setPendingUsers(data.filter(user => user.pending));
            setExistingUsers(data.filter(user => !user.pending));
        } finally {
            console.log("loading complete");
        }
    };

    const handleAccept = async () => {
        setIsSaving(true);
        try {
            const response = await acceptUser();
            if (response.ok) {
                setExistingUsers([...existingUsers, {email: selectedUser, role: selectedOption}]);
                const updatedUsers = pendingUsers.filter(u => u.email !== selectedUser);
                setPendingUsers(updatedUsers);
            }

            if (!response.ok) {
                let errorMsg = "Failed to accept user.";
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

            setSnackbarMessage("User accepted successfully!");
            setShowSnackbar(true);
        } catch (err) {
            console.error("Accept failed:", err);
            setSnackbarMessage("Failed to accept user (network error).");
            setShowSnackbar(true);
        } finally {
            setIsSaving(false)
        }

        console.log("Email:", selectedUser);
        console.log("Checkbox:", selectedOption);
        
        setShowPopup(false);
        setSelectedUser("");
    };

    const handleDeny = async (email) => {
        const confirmBox = window.confirm(
            `Are you sure you want to deny ${email}?`
        )
        if (!confirmBox) {
            setSelectedUser("")
            setSnackbarMessage("Deny canceled");
            setShowSnackbar(true);
            return;
        }
        setIsDeleting(true)
        try {
            const response = await denyUser(email);
            if (response.ok) {
                const updatedUsers = pendingUsers.filter(u => u.email !== email);
                setPendingUsers(updatedUsers);
            }

            if (!response.ok) {
                let errorMsg = "Failed to deny user.";
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

            setSnackbarMessage("User denied successfully!");
            setShowSnackbar(true);
        } catch (err) {
            console.error("Deny failed:", err);
            setSnackbarMessage("Failed to deny user (network error).");
            setShowSnackbar(true);
        } finally {
            setIsDeleting(false)
        }
    }

    const denyUser = (userEmail) => {
        return fetch(`${API_BASE}/deny_user`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: userEmail,
            }),
        });
    };

    const acceptUser = () => {
        return fetch(`${API_BASE}/accept_user`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: selectedUser,
                role: selectedOption,
                pending: false
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
              <div className="user-box" key={index}>
                <p>{user.email}, {user.role}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="pending-users">
          <h1>Pending users</h1>
          <div className="user-boxes">
            {pendingUsers.map((user, index) => (
            <div className="user-box" key={index}>
              <p>{user.email}</p>
              <button className="deny-button" onClick={() => {handleDeny(user.email)}}>
                Deny
              </button>
              <button className="accept-button" onClick={() => {setSelectedUser(user.email), setShowPopup(true)}}>
                Accept
              </button>
            </div>
            ))}
          </div>
        </div>

        {/* Popup */}
        {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Accept User</h2>

            <div className="options">
              <p>Select a role for {selectedUser}:</p>

              <label>
                <input
                  type="radio"
                  name="choice"
                  value="admin"
                  checked={selectedOption === "admin"}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                Admin
              </label>

              <label>
                <input
                  type="radio"
                  name="choice"
                  value="gamemaster"
                  checked={selectedOption === "gamemaster"}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                Gamemaster
              </label>
            </div>

            <div className="buttons">
              <button onClick={() => {setShowPopup(false), setSelectedUser("")}}>Cancel</button>
              <button onClick={handleAccept}>Accept</button>
            </div>
          </div>
        </div>
        )}
      </div>
      </>
    );
};

export default EditUsers
