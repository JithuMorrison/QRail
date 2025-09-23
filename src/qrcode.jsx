// context/QRContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const QRContext = createContext();

export const QRProvider = ({ children }) => {
  const [qrCodes, setQrCodes] = useState([]);
  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    const mockQRCodes = [
      {
        id: '1',
        qrCode: 'QR:ERC:001:VendorA',
        itemType: 'ERC',
        vendor: 'Vendor A',
        lotNumber: 'LOT-2024-001',
        manufactureDate: '2024-01-15',
        warrantyExpiry: '2026-01-15',
        status: 'installed',
        currentLocation: 'Track Section 12B',
        gpsCoordinates: { lat: 28.6139, lng: 77.2090 }
      },
      {
        id: '2',
        qrCode: 'QR:Sleeper:002:VendorB',
        itemType: 'Sleeper',
        vendor: 'Vendor B',
        lotNumber: 'LOT-2024-002',
        manufactureDate: '2024-02-01',
        warrantyExpiry: '2026-02-01',
        status: 'in_depot',
        currentLocation: 'Central Depot'
      }
    ];
    
    setQrCodes(mockQRCodes);
  }, []);

  const generateQRCodes = async (data) => {
    const newQRCodes = [];
    const warrantyExpiry = new Date(data.manufactureDate);
    warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 2);
    
    for (let i = 0; i < data.quantity; i++) {
      const qrCode = {
        id: Date.now().toString() + i,
        qrCode: `QR:${data.lotNumber}:${data.itemType}:${data.vendor}:${i}`,
        itemType: data.itemType,
        vendor: data.vendor,
        lotNumber: data.lotNumber,
        manufactureDate: data.manufactureDate,
        warrantyExpiry: warrantyExpiry.toISOString().split('T')[0],
        status: 'manufactured',
        currentLocation: 'Vendor Facility'
      };
      
      newQRCodes.push(qrCode);
    }
    
    setQrCodes(prev => [...prev, ...newQRCodes]);
    return newQRCodes;
  };

  const getQRDetails = async (qrData) => {
    const qrCode = qrCodes.find(qr => qr.qrCode === qrData || qr.id === qrData);
    if (!qrCode) {
      throw new Error('QR code not found');
    }
    return qrCode;
  };

  const updateQRStatus = async (id, status) => {
    setQrCodes(prev => prev.map(qr => 
      qr.id === id ? { ...qr, status } : qr
    ));
  };

  const updateInstallation = async (id, installation) => {
    setQrCodes(prev => prev.map(qr => 
      qr.id === id ? { 
        ...qr, 
        status: 'installed',
        currentLocation: installation.trackSectionId,
        gpsCoordinates: installation.gpsCoordinates
      } : qr
    ));
  };

  const addInspection = async (inspection) => {
    const newInspection = {
      ...inspection,
      id: Date.now().toString()
    };
    
    setInspections(prev => [...prev, newInspection]);
  };

  const getWarrantyAlerts = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return qrCodes.filter(qr => {
      const expiryDate = new Date(qr.warrantyExpiry);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    });
  };

  return (
    <QRContext.Provider value={{
      qrCodes,
      inspections,
      generateQRCodes,
      getQRDetails,
      updateQRStatus,
      updateInstallation,
      addInspection,
      getWarrantyAlerts
    }}>
      {children}
    </QRContext.Provider>
  );
};

export const useQR = () => {
  const context = useContext(QRContext);
  if (context === undefined) {
    throw new Error('useQR must be used within a QRProvider');
  }
  return context;
};