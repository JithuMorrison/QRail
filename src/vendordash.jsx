import React, { useState } from 'react';
import QRGenerator from './qrcode';

const VendorDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [batches, setBatches] = useState([]);

  const CreateBatchForm = () => {
    const [formData, setFormData] = useState({
      material: '',
      manufacturer: '',
      manufactureDate: '',
      warranty: '',
      quantity: 1,
      category: '',
      quality: 'Grade A',
      specifications: {}
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/batches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          alert('Batch created successfully!');
          setFormData({
            material: '',
            manufacturer: '',
            manufactureDate: '',
            warranty: '',
            quantity: 1,
            category: '',
            quality: 'Grade A',
            specifications: {}
          });
        }
      } catch (error) {
        alert('Error creating batch');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="batch-form">
        <h3>Create New Batch</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Material"
            value={formData.material}
            onChange={(e) => setFormData({...formData, material: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Manufacturer"
            value={formData.manufacturer}
            onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
            required
          />
          <input
            type="date"
            value={formData.manufactureDate}
            onChange={(e) => setFormData({...formData, manufactureDate: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Warranty"
            value={formData.warranty}
            onChange={(e) => setFormData({...formData, warranty: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
            min="1"
            required
          />
          <select
            value={formData.quality}
            onChange={(e) => setFormData({...formData, quality: e.target.value})}
          >
            <option value="Grade A+">Grade A+</option>
            <option value="Grade A">Grade A</option>
            <option value="Grade B+">Grade B+</option>
            <option value="Grade B">Grade B</option>
          </select>
        </div>
        <button type="submit">Create Batch</button>
      </form>
    );
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Vendor Dashboard</h1>
        <div>
          <span>Welcome, {user.username}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Create Batch
        </button>
        <button 
          className={activeTab === 'generate' ? 'active' : ''}
          onClick={() => setActiveTab('generate')}
        >
          Generate QR Codes
        </button>
        <button 
          className={activeTab === 'batches' ? 'active' : ''}
          onClick={() => setActiveTab('batches')}
        >
          My Batches
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'create' && <CreateBatchForm />}
        {activeTab === 'generate' && <QRGenerator />}
        {activeTab === 'batches' && <div>Batches List</div>}
      </div>
    </div>
  );
};

export default VendorDashboard;