// Παράδειγμα χρήσης της offline-friendly api() function
// Example usage of the offline-friendly api() function

// Βασική χρήση - Basic usage
async function testApiConnection() {
    try {
        const response = await api('/api/ping');
        let data = null;
        try { data = await response.json(); } catch {}
        if (!response.ok || !data) {
            throw new Error('Invalid API response');
        }
        console.log('API Response:', data);
    } catch (error) {
        console.error('API call failed:', error.message);
        // Fallback σε localStorage ή cached data
        // Fallback to localStorage or cached data
    }
}

// GET request με parameters
async function getPatients(filters = {}) {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const path = `/api/patients${queryString ? '?' + queryString : ''}`;
        const response = await api(path);
        let patients = null;
        try { patients = await response.json(); } catch {}
        if (!response.ok || !patients) {
            throw new Error('Invalid patients response');
        }
        return patients;
    } catch (error) {
        console.warn('Patients API offline, using local data');
        // Επιστροφή cached δεδομένων από localStorage
        const cachedPatients = localStorage.getItem('patients');
        return cachedPatients ? JSON.parse(cachedPatients) : [];
    }
}

// POST request για δημιουργία νέου ασθενή
async function createPatient(patientData) {
    try {
        const response = await api('/api/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });
        let newPatient = null;
        try { newPatient = await response.json(); } catch {}
        if (!response.ok || !newPatient) {
            throw new Error('Invalid create patient response');
        }
        console.log('Patient created:', newPatient);
        return newPatient;
    } catch (error) {
        console.warn('Cannot create patient online, queuing for sync');
        // Αποθήκευση στο sync queue για μελλοντική αποστολή
        const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
        syncQueue.push({
            type: 'CREATE_PATIENT',
            data: patientData,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
        
        // Δημιουργία τοπικού temporary record
        const tempPatient = {
            ...patientData,
            id: 'temp_' + Date.now(),
            _pending: true
        };
        return tempPatient;
    }
}

// PUT request για ενημέρωση ασθενή
async function updatePatient(patientId, updates) {
    try {
        const response = await api(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        let updatedPatient = null;
        try { updatedPatient = await response.json(); } catch {}
        if (!response.ok || !updatedPatient) {
            throw new Error('Invalid update patient response');
        }
        console.log('Patient updated:', updatedPatient);
        return updatedPatient;
    } catch (error) {
        console.warn('Cannot update patient online, saving locally');
        // Τοπική ενημέρωση και queue για sync
        const patients = JSON.parse(localStorage.getItem('patients') || '[]');
        const patientIndex = patients.findIndex(p => p.id === patientId);
        if (patientIndex !== -1) {
            patients[patientIndex] = { ...patients[patientIndex], ...updates, _modified: true };
            localStorage.setItem('patients', JSON.stringify(patients));
        }
        throw error;
    }
}

// Utility function για έλεγχο κατάστασης API
async function checkApiStatus() {
    try {
        const response = await api('/api/ping');
        let status = null;
        try { status = await response.json(); } catch {}
        if (!response.ok || !status) {
            throw new Error('Invalid API status response');
        }
        return { online: true, status };
    } catch (error) {
        return { online: false, error: error.message };
    }
}

// Export functions για χρήση σε άλλα modules
if (typeof window !== 'undefined') {
    window.apiExamples = {
        testApiConnection,
        getPatients,
        createPatient,
        updatePatient,
        checkApiStatus
    };
}

// Auto-test κατά την φόρτωση
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Testing API connection...');
    const status = await checkApiStatus();
    console.log('API Status:', status);
});