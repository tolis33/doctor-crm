// API Manager για μελλοντική επέκταση με backend
// Κεντρική διαχείριση API calls και data synchronization

// Detect if we're in a packaged environment (not localhost/127.0.0.1)
const USE_API = (location.hostname !== 'appassets' && location.protocol !== 'file:');

class APIManager {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.apiKey = storageGet('apiKey', null);
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.endpoints = {
            patients: '/api/patients',
            appointments: '/api/appointments',
            xrays: '/api/images',
            events: '/api/events',
            auth: '/api/auth',
            sync: '/api/sync'
        };
        
        this.setupNetworkMonitoring();
        this.setupOfflineSync();
    }

    // Determine base URL based on environment
    getBaseURL() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5059'; // Development
        } else {
            return 'https://api.stomadiagnosis.com'; // Production
        }
    }

    // Setup network monitoring
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
            this.showNetworkStatus('Σύνδεση αποκαταστάθηκε', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNetworkStatus('Λειτουργία χωρίς σύνδεση', 'warning');
        });
    }

    // Setup offline synchronization
    setupOfflineSync() {
        // Load pending sync operations
        const savedQueue = storageGet('syncQueue', null);
        if (savedQueue) {
            this.syncQueue = JSON.parse(savedQueue);
        }

        // Auto-sync every 5 minutes when online
        setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.processSyncQueue();
            }
        }, 5 * 60 * 1000);
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        // In packaged environment, skip API calls and use local storage
        if (!USE_API) {
            console.log('Packaged environment detected, skipping API call:', endpoint);
            return { success: false, error: 'API disabled in packaged environment' };
        }

        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        // Add API key if available
        if (this.apiKey) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            if (response.status === 204) {
                return { success: true, data: null };
            }
            
            const text = await response.text();
            console.log('📤 API response text:', text); // Log response text
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = text ? JSON.parse(text) : null;
            return { success: true, data };
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.logError('API_ERROR', {
                    endpoint,
                    error: error.message,
                    options: finalOptions
                });
            }
            
            return { success: false, error: error.message };
    }
}

// Offline-friendly fetch wrapper
async function api(path, opt = {}) {
    // In packaged environment, skip API calls
    if (!USE_API) {
        console.log('Packaged environment detected, skipping API call:', path);
        throw new Error('API disabled in packaged environment');
    }
    
    try {
        const r = await fetch(`http://127.0.0.1:5059${path}`, opt);
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r;
    } catch (e) {
        console.warn('API offline:', e.message);
        // εδώ μπορείς να πέσεις σε localStorage fallback αν θες
        throw e;
    }
}

// Export για global χρήση
window.api = api;

// Authentication methods
    async login(credentials) {
        const result = await this.request(this.endpoints.auth + '/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (result.success) {
            this.apiKey = result.data.token;
            storageSet('apiKey', this.apiKey);
            storageSet('user', result.data.user);
        }

        return result;
    }

    async logout() {
        const result = await this.request(this.endpoints.auth + '/logout', {
            method: 'POST'
        });

        this.apiKey = null;
        localStorage.removeItem('apiKey');
        localStorage.removeItem('user');

        return result;
    }

    // Patient API methods
    async getPatients(filters = {}) {
        if (!this.isOnline) {
            return this.getLocalPatients(filters);
        }

        const queryString = new URLSearchParams(filters).toString();
        const endpoint = `${this.endpoints.patients}${queryString ? '?' + queryString : ''}`;
        
        const result = await this.request(endpoint);
        
        if (result.success) {
            // Update local storage
            storageSet('patients', result.data);
        }
        
        return result;
    }

    async createPatient(patientData) {
        const operation = {
            type: 'CREATE',
            entity: 'patient',
            data: patientData,
            timestamp: new Date().toISOString(),
            id: this.generateTempId()
        };

        if (this.isOnline) {
            const result = await this.request(this.endpoints.patients, {
                method: 'POST',
                body: JSON.stringify(patientData)
            });

            if (result.success) {
                this.updateLocalPatient(result.data);
                return result;
            } else {
                this.addToSyncQueue(operation);
                return { success: false, error: 'Αποθηκεύτηκε για συγχρονισμό' };
            }
        } else {
            this.addToSyncQueue(operation);
            this.createLocalPatient(patientData);
            return { success: true, offline: true };
        }
    }

    async updatePatient(patientId, patientData) {
        const operation = {
            type: 'UPDATE',
            entity: 'patient',
            id: patientId,
            data: patientData,
            timestamp: new Date().toISOString()
        };

        if (this.isOnline) {
            const result = await this.request(`${this.endpoints.patients}/${patientId}`, {
                method: 'PUT',
                body: JSON.stringify(patientData)
            });

            if (result.success) {
                this.updateLocalPatient(result.data);
                return result;
            } else {
                this.addToSyncQueue(operation);
                return { success: false, error: 'Αποθηκεύτηκε για συγχρονισμό' };
            }
        } else {
            this.addToSyncQueue(operation);
            this.updateLocalPatient({ id: patientId, ...patientData });
            return { success: true, offline: true };
        }
    }

    async deletePatient(patientId) {
        const operation = {
            type: 'DELETE',
            entity: 'patient',
            id: patientId,
            timestamp: new Date().toISOString()
        };

        if (this.isOnline) {
            const result = await this.request(`${this.endpoints.patients}/${patientId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                this.deleteLocalPatient(patientId);
                return result;
            } else {
                this.addToSyncQueue(operation);
                return { success: false, error: 'Αποθηκεύτηκε για συγχρονισμό' };
            }
        } else {
            this.addToSyncQueue(operation);
            this.deleteLocalPatient(patientId);
            return { success: true, offline: true };
        }
    }

    // Appointment API methods
    async getAppointments(filters = {}) {
        if (!this.isOnline) {
            return this.getLocalAppointments(filters);
        }

        const queryString = new URLSearchParams(filters).toString();
        const endpoint = `${this.endpoints.appointments}${queryString ? '?' + queryString : ''}`;
        
        const result = await this.request(endpoint);
        
        if (result.success) {
            storageSet('appointments', result.data);
        }
        
        return result;
    }

    async createAppointment(appointmentData) {
        const operation = {
            type: 'CREATE',
            entity: 'appointment',
            data: appointmentData,
            timestamp: new Date().toISOString(),
            id: this.generateTempId()
        };

        if (this.isOnline) {
            const result = await this.request(this.endpoints.appointments, {
                method: 'POST',
                body: JSON.stringify(appointmentData)
            });

            if (result.success) {
                this.updateLocalAppointment(result.data);
                return result;
            } else {
                this.addToSyncQueue(operation);
                return { success: false, error: 'Αποθηκεύτηκε για συγχρονισμό' };
            }
        } else {
            this.addToSyncQueue(operation);
            this.createLocalAppointment(appointmentData);
            return { success: true, offline: true };
        }
    }

    // X-ray API methods
    async uploadXray(xrayData, file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('data', JSON.stringify(xrayData));

        const operation = {
            type: 'UPLOAD',
            entity: 'xray',
            data: xrayData,
            file: file,
            timestamp: new Date().toISOString(),
            id: this.generateTempId()
        };

        if (this.isOnline) {
            const result = await this.request(this.endpoints.xrays, {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set Content-Type for FormData
            });

            if (result.success) {
                this.updateLocalXray(result.data);
                return result;
            } else {
                this.addToSyncQueue(operation);
                return { success: false, error: 'Αποθηκεύτηκε για συγχρονισμό' };
            }
        } else {
            this.addToSyncQueue(operation);
            this.createLocalXray(xrayData);
            return { success: true, offline: true };
        }
    }

    // Sync queue management
    addToSyncQueue(operation) {
        this.syncQueue.push(operation);
        this.saveSyncQueue();
    }

    saveSyncQueue() {
        storageSet('syncQueue', this.syncQueue);
    }

    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) {
            return;
        }

        const operations = [...this.syncQueue];
        this.syncQueue = [];
        this.saveSyncQueue();

        for (const operation of operations) {
            try {
                await this.processOperation(operation);
            } catch (error) {
                console.error('Sync operation failed:', error);
                // Re-add failed operation to queue
                this.addToSyncQueue(operation);
            }
        }
    }

    async processOperation(operation) {
        switch (operation.entity) {
            case 'patient':
                return await this.syncPatientOperation(operation);
            case 'appointment':
                return await this.syncAppointmentOperation(operation);
            case 'xray':
                return await this.syncXrayOperation(operation);
            default:
                throw new Error(`Unknown entity type: ${operation.entity}`);
        }
    }

    async syncPatientOperation(operation) {
        switch (operation.type) {
            case 'CREATE':
                return await this.createPatient(operation.data);
            case 'UPDATE':
                return await this.updatePatient(operation.id, operation.data);
            case 'DELETE':
                return await this.deletePatient(operation.id);
        }
    }

    // Local storage methods
    getLocalPatients(filters = {}) {
        const patients = storageGet('patients', []);
        return { success: true, data: this.filterData(patients, filters) };
    }

    createLocalPatient(patientData) {
        const patients = storageGet('patients', []);
        const newPatient = {
            ...patientData,
            id: patientData.id || this.generateTempId(),
            _offline: true
        };
        patients.push(newPatient);
        storageSet('patients', patients);
        return newPatient;
    }

    updateLocalPatient(patientData) {
        const patients = storageGet('patients', []);
        const index = patients.findIndex(p => p.id === patientData.id);
        if (index !== -1) {
            patients[index] = { ...patients[index], ...patientData };
            delete patients[index]._offline;
        } else {
            patients.push(patientData);
        }
        storageSet('patients', patients);
    }

    deleteLocalPatient(patientId) {
        const patients = storageGet('patients', []);
        const filtered = patients.filter(p => p.id !== patientId);
        storageSet('patients', filtered);
    }

    // Utility methods
    generateTempId() {
        return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    filterData(data, filters) {
        if (Object.keys(filters).length === 0) {
            return data;
        }

        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === null || value === undefined || value === '') {
                    return true;
                }
                return item[key] && item[key].toString().toLowerCase().includes(value.toString().toLowerCase());
            });
        });
    }

    showNetworkStatus(message, type) {
        // Show network status notification
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`Network Status [${type}]: ${message}`);
        }
    }

    // Health check
    async healthCheck() {
        try {
            const result = await this.request('/api/health');
            return result.success;
        } catch (error) {
            return false;
        }
    }

    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            pendingOperations: this.syncQueue.length,
            lastSync: storageGet('lastSyncTime', null),
            hasApiKey: !!this.apiKey
        };
    }

    // Force sync
    async forceSync() {
        if (this.isOnline) {
            await this.processSyncQueue();
            storageSet('lastSyncTime', new Date().toISOString());
            return true;
        }
        return false;
    }
}

// Export για global χρήση
window.APIManager = APIManager;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!window.apiManager) {
        window.apiManager = new APIManager();
        console.log('API Manager initialized');
    }
});