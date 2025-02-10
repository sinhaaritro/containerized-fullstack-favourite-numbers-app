import React, { useState, useEffect } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateNumber, setUpdateNumber] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/items');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setItems(data);
    } catch (e) {
      setError(e);
      console.error("Could not fetch items:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newName.trim() || isNaN(Number(newNumber))) {
      alert("Please enter a valid name and number.");
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, number: Number(newNumber) }),
      });
      if (!response.ok) {
        const message = await response.json().then(body => body.message) || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }
      setNewName('');
      setNewNumber('');
      fetchItems(); // Refresh item list
    } catch (e) {
      setError(e);
      alert(`Failed to add item: ${e.message}`);
    }
  };

  const handleDeleteItem = async (name) => {
    try {
      const response = await fetch(`http://localhost:3001/api/items/${name}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const message = await response.json().then(body => body.message) || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }
      fetchItems(); // Refresh item list
    } catch (e) {
      setError(e);
      alert(`Failed to delete item: ${e.message}`);
    }
  };

  const handleUpdateNumber = async (e) => {
    e.preventDefault();
    if (!updateName.trim() || isNaN(Number(updateNumber))) {
      alert("Please enter a valid name to update and a new number.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/items/${updateName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: Number(updateNumber) }),
      });
      if (!response.ok) {
        const message = await response.json().then(body => body.message) || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }
      setUpdateName('');
      setUpdateNumber('');
      fetchItems(); // Refresh item list
    } catch (e) {
      setError(e);
      alert(`Failed to update item: ${e.message}`);
    }
  };


  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading items...</p>;
  }

  if (error) {
    return <p style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Error: Could not fetch items.</p>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>Names and Numbers</h1>

      <form onSubmit={handleAddItem} style={{ marginBottom: '20px' }}>
        <h3>Add New Item</h3>
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Number"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          required
        />
        <button type="submit">Add Item</button>
      </form>

      <form onSubmit={handleUpdateNumber} style={{ marginBottom: '20px' }}>
        <h3>Update Number</h3>
        <input
          type="text"
          placeholder="Name to update"
          value={updateName}
          onChange={(e) => setUpdateName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="New Number"
          value={updateNumber}
          onChange={(e) => setUpdateNumber(e.target.value)}
          required
        />
        <button type="submit">Update Number</button>
      </form>


      <div>
        <h3>Current Items</h3>
        <ul>
          {items.map((item) => (
            <li key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px', borderBottom: '1px solid #eee' }}>
              <span>{item.name}: {item.number}</span>
              <button onClick={() => handleDeleteItem(item.name)} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
