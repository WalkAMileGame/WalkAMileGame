import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import '../styles/EditUsers.css';
import Snackbar from "./ui/snackbar"
import { API_BASE } from "../api";
import { useAuth } from '../context/AuthContext';
import searchIcon from '../styles/icons/searchicon.png';
import deleteIcon from '../styles/icons/deleteicon.png';
import promoteIcon from '../styles/icons/uparrow.png';
import demoteIcon from '../styles/icons/downarrow.png';
import userIcon from '../styles/icons/usericon.png';
import acceptIcon from '../styles/icons/accepticon.png';
import rejectIcon from '../styles/icons/rejecticon.png';


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
  const [unActivatedCodes, setUnActivatedCodes] = useState([])
  const [expiredCodes, setExpiredCodes] = useState([])
  const [searchTerm, setSearchTerm] = useState("");
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); 
  const [codeSortConfig, setCodeSortConfig] = useState({ key: null, direction: 'asc' });
  const [codeDuration, setCodeDuration] = useState(6);

  const { user } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log("loading users");
      const res = await fetch(`${API_BASE}/load_user_data`);

      if (!res.ok) {
        console.error("Failed to fetch data");
        return;
      }

      const data = await res.json();
      
      const rawUsers = data.users;
      const codesList = data.codes;

      const enrichedUsers = rawUsers.map(u => {
        const userCode = codesList.find(c => c.usedByUser === u.email);
        return {
          ...u,
          date_created: userCode ? userCode.creationTime : null,
          expiration_date: userCode ? userCode.expirationTime : null
        };
      });

      setPendingUsers(enrichedUsers.filter(user => user.pending));
      setExistingUsers(enrichedUsers.filter(user => !user.pending));

      const now = new Date();
      setUnActivatedCodes(codesList.filter(code => !code.isUsed));
      setExpiredCodes(codesList.filter(code => new Date(code.expirationTime) < now));

    } catch (error) {
      console.error("Error loading users:", error)
    }
  };

  const handleGenerateCode = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/generate_access_code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valid_for: codeDuration })
      });
      
      if (response.ok) {
        setSnackbarMessage("New access code generated!");
        setShowSnackbar(true);
        loadUsers();
      } else {
        setSnackbarMessage("Failed to generate code.");
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error(err);
      setSnackbarMessage("Error generating code.");
      setShowSnackbar(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCode = async (codeStr) => {
    const confirmBox = window.confirm(`Delete access code ${codeStr}?`);
    if (!confirmBox) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/remove_access_code`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeStr }) 
      });

      if (response.ok) {
        setUnActivatedCodes(unActivatedCodes.filter(c => c.code !== codeStr));
        setSnackbarMessage("Code deleted.");
        setShowSnackbar(true);
      } else {
        setSnackbarMessage("Failed to delete code.");
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error("Delete code failed:", err);
      setSnackbarMessage("Failed to delete code (network error).");
      setShowSnackbar(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemove = async (email) => {
    const confirmBox = window.confirm(
      `Are you sure you want to remove ${email}?`
    )
    if (!confirmBox) {
      setSelectedUser("")
      setSnackbarMessage("Remove canceled");
      setShowSnackbar(true);
      return;
    }
    setIsDeleting(true)
    try {
      const response = await removeUser(email);
      if (response.ok) {
        const updatedUsers = existingUsers.filter(u => u.email !== email);
        setExistingUsers(updatedUsers);
      }

      if (!response.ok) {
        let errorMsg = "Failed to remove user.";
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

      setSnackbarMessage("User removed successfully!");
      setShowSnackbar(true);
    } catch (err) {
      console.error("Remove failed:", err);
      setSnackbarMessage("Failed to remove user (network error).");
      setShowSnackbar(true);
    } finally {
      setIsDeleting(false)
    }
    }

  const handlePromote = async (email) => {
    const confirmBox = window.confirm(`Promote ${email} to admin?`);
    if (!confirmBox) return;

    setIsSaving(true);

    try {
      const response = await changeUserRole(email, "admin");
      if (response.ok) {
        const updatedUsers = existingUsers.map(u => 
          u.email === email ? { ...u, role: "admin" } : u
        );
        setExistingUsers(updatedUsers);
        setSnackbarMessage("User promoted successfully");
        setShowSnackbar(true);
      } else {
        let errorMsg = "Failed to promote user";
        try {
          const data = await response.json();
          if (data?.error) errorMsg = data.error;
        } catch (err) {
          console.error(errorMsg);
        }
      }
    } catch (err) {
      console.error("Promotion error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDemote = async (email) => {
    const confirmBox = window.confirm(`Demote ${email} to gamemaster?`);
    if (!confirmBox) return;

    setIsSaving(true);

    try {
      const response = await changeUserRole(email, "gamemaster");
      if (response.ok) {
        const updatedUsers = existingUsers.map(u => 
          u.email === email ? { ...u, role: "gamemaster" } : u
        );
        setExistingUsers(updatedUsers);
        setSnackbarMessage("User demoted successfully");
        setShowSnackbar(true);
      } else {
        let errorMsg = "Failed to demote user";
        try {
          const data = await response.json();
          if (data?.error) errorMsg = data.error;
        } catch (err) {
          console.error(errorMsg);
        }
      }
    } catch (err) {
      console.error("Demotion error:", err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAccept = async () => {
    setIsSaving(true);
    try {
      const response = await acceptUser();
      if (response.ok) {
        const userToMove = pendingUsers.find(u => u.email === selectedUser);
        if (userToMove) {
             setExistingUsers([...existingUsers, { ...userToMove, role: selectedOption, pending: false }]);
             const updatedUsers = pendingUsers.filter(u => u.email !== selectedUser);
             setPendingUsers(updatedUsers);
        }
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
      const response = await removeUser(email);
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


  const removeUser = (userEmail) => {
    return fetch(`${API_BASE}/remove_user`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
      }),
    });
  };

    const changeUserRole = (email, newrole) => {
    return fetch(`${API_BASE}/accept_user`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        role: newrole,
        pending: false
      })
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
  
//search bar
  const filteredUsers = existingUsers.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) 
  );

// User Sorting Logic
const sortedUsers = [...filteredUsers].sort((a, b) => {
  if (!sortConfig.key) return 0;

  const aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]) : 0;
  const bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]) : 0;

  if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
  if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
  return 0;
});

const handleSort = (key) => {
  let direction = 'asc';
  if (sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setSortConfig({ key, direction });
};

// Access Code Sorting Logic
const sortedCodes = [...unActivatedCodes].sort((a, b) => {
  if (!codeSortConfig.key) return 0;
  
  const aVal = new Date(a[codeSortConfig.key]);
  const bVal = new Date(b[codeSortConfig.key]);

  if (aVal < bVal) return codeSortConfig.direction === 'asc' ? -1 : 1;
  if (aVal > bVal) return codeSortConfig.direction === 'asc' ? 1 : -1;
  return 0;
});

const handleCodeSort = (key) => {
  let direction = 'asc';
  if (codeSortConfig.key === key && codeSortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setCodeSortConfig({ key, direction });
  };


  return (
    <div className="edit-page">
      <div className="header">
        <h1>USER MANAGEMENT</h1>
        <h3>Manage all users in one place. Control roles and manage activation codes. All unused codes are at the bottom of the active user table.</h3>
      </div>
      <div className="table-area">
        {/* Active Users */}
        <div className="table-wrapper">
          <h2>Active users</h2>
          <input
            type="text"
            id="myInput"
            placeholder="Search for users..."
            title="Type in an email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundImage: `url(${searchIcon})`,
              backgroundPosition: "15px 12px",
              backgroundRepeat: "no-repeat",
              backgroundSize: "18px 18px",
              paddingLeft: "40px",
              marginBottom: "12px",
            }}
          />

          <table id="existing-users">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th onClick={() => handleSort('date_created')} style={{ cursor: 'pointer' }}>
                  Date created{' '} {sortConfig.key === 'date_created' ? sortConfig.direction === 'asc' ? '▲' : '▼': '▼'}
                </th>
                <th onClick={() => handleSort('expiration_date')} style={{ cursor: 'pointer' }}>
                  Expiration date{' '} {sortConfig.key === 'expiration_date' ? sortConfig.direction === 'asc' ? '▲' : '▼': '▼'}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u, index) => (
                <tr key={index}>
                  <td>                      <img
                            src={userIcon}
                            alt="user"
                            className="user-icon"
                              /> {u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.date_created
                      ? new Date(u.date_created).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {u.expiration_date
                      ? new Date(u.expiration_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {u.email !== user?.email && (
                      <div className="editbuttons">
                        {u.role === "gamemaster" && (
                       <img
                            src={promoteIcon}
                            alt="promote"
                            className="promote-icon"
                                onClick={() => handlePromote(u.email)}
                                title="Promote"
                              />
                        )}
                        {u.role === "admin" && (
                          <img
                            src={demoteIcon}
                            alt="demote"
                            className="demote-icon"
                                onClick={() => handleDemote(u.email)}
                                title="Demote"
                              />
                        )}
                          <img
                            src={deleteIcon}
                            alt="delete"
                            className="remove-button"
                                onClick={() => handleRemove(u.email)}
                                title="Delete"
                              />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="table-wrapper">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2>Access codes</h2>

            <div className="generate-code-box">
                <label style={{ fontFamily: "Montserrat", color: 'black', fontSize: "16px" }}>Valid for (months):</label>
                <input 
                  class="generate-code-input"
                  type="number" 
                  min="1" 
                  max="24" 
                  value={codeDuration} 
                  onChange={(e) => setCodeDuration(parseInt(e.target.value) || 1)}
                />
                <button 
                  className="generate-code-button"
                  onClick={handleGenerateCode} 
                  disabled={isSaving}
                >
                  {isSaving ? "Generating..." : "Generate new code"}
                </button>
            </div>
          </div>
          
          <table id="access-codes">
            <thead>
              <tr>
                <th>Code</th>
                <th onClick={() => handleCodeSort('creationTime')} style={{ cursor: 'pointer' }}>
                  Date created{' '} {codeSortConfig.key === 'creationTime' ? (codeSortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                </th>
                <th onClick={() => handleCodeSort('expirationTime')} style={{ cursor: 'pointer' }}>
                  Expiration date{' '} {codeSortConfig.key === 'expirationTime' ? (codeSortConfig.direction === 'asc' ? '▲' : '▼') : '▼'}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCodes.map((codeObj, index) => (
                <tr key={index}>
                  <td>{codeObj.code}</td>
                  <td>
                    {new Date(codeObj.creationTime).toLocaleDateString()}
                  </td>
                  <td>
                    {new Date(codeObj.expirationTime).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="editbuttons">
                      <img
                        src={deleteIcon}
                        alt="delete"
                        className="remove-button"
                        onClick={() => handleDeleteCode(codeObj.code)}
                        title="Delete Code"
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {sortedCodes.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                    No active codes available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              <button onClick={handleAccept}>Accept</button>
              <button
                onClick={() => {
                  setShowPopup(false);
                  setSelectedUser("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
);
};

export default EditUsers;
