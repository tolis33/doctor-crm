/**
 * Data Manager - Διαχείριση φόρτωσης δεδομένων ασθενών με fallback μηχανισμό
 * Σειρά προτεραιότητας:
 * 1. API endpoint
 * 2. JSON αρχεία (patients_backup.json, sample-patient-data.json)
 * 3. Embedded data
 * 4. LocalStorage
 */

// ---- Config ----
// Dev/server only. Σε packaged (appassets) θα είναι false.
const USE_API = (location.hostname !== 'appassets' && location.protocol !== 'file:');

class DataManager {
    constructor() {
        this.apiEndpoint = '/api/patients'; // Για μελλοντική χρήση
        this.jsonSources = [
            'sample-patients-test.json',
            'patients_backup.json',
            'sample-patient-data.json',
            'patients/index.json'
        ];
        this.fallbackOrder = ['embedded', 'api', 'json', 'localStorage'];
        this.loadedSource = null;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Κύρια μέθοδος φόρτωσης δεδομένων
     */
    async loadPatientData() {
        console.log('🔄 Έναρξη φόρτωσης δεδομένων ασθενών...');
        
        for (const source of this.fallbackOrder) {
            try {
                console.log(`📡 Προσπάθεια φόρτωσης από: ${source}`);
                const data = await this.loadFromSource(source);
                
                if (data && data.patients && data.patients.length > 0) {
                    this.loadedSource = source;
                    console.log(`✅ Επιτυχής φόρτωση από ${source} - ${data.patients.length} ασθενείς`);
                    return this.transformData(data);
                }
            } catch (error) {
                console.warn(`⚠️ Αποτυχία φόρτωσης από ${source}:`, error.message);
                continue;
            }
        }
        
        throw new Error('Αποτυχία φόρτωσης δεδομένων από όλες τις πηγές');
    }

    /**
     * Φόρτωση από συγκεκριμένη πηγή
     */
    async loadFromSource(source) {
        switch (source) {
            case 'api':
                return await this.loadFromAPI();
            case 'json':
                return await this.loadFromJSON();
            case 'embedded':
                return await this.loadFromEmbedded();
            case 'localStorage':
                return await this.loadFromLocalStorage();
            default:
                throw new Error(`Άγνωστη πηγή δεδομένων: ${source}`);
        }
    }

    /**
     * Φόρτωση από API (μελλοντική χρήση)
     */
    async loadFromAPI() {
        if (!USE_API) {
            throw new Error('API απενεργοποιημένο');
        }
        
        const response = await fetch(this.apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 5000
        });

        let data = null;
        try { data = await response.json(); } catch {}
        if (!response.ok || !data) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return data;
    }

    /**
     * Φόρτωση από JSON αρχεία
     */
    async loadFromJSON() {
        let lastError = null;
        
        for (const jsonFile of this.jsonSources) {
            try {
                console.log(`📄 Προσπάθεια φόρτωσης από: ${jsonFile}`);
                const response = await fetch(jsonFile, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-cache'
                });

                let data = null;
                try { data = await response.json(); } catch {}
                if (!response.ok || !data) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Έλεγχος εγκυρότητας δεδομένων
                if (this.validateData(data)) {
                    console.log(`✅ Επιτυχής φόρτωση από ${jsonFile}`);
                    return data;
                }
                
                throw new Error('Μη έγκυρα δεδομένα');
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Αποτυχία φόρτωσης από ${jsonFile}:`, error.message);
                continue;
            }
        }
        
        throw lastError || new Error('Αποτυχία φόρτωσης από όλα τα JSON αρχεία');
    }

    /**
     * Φόρτωση από embedded data
     */
    async loadFromEmbedded() {
        if (typeof getEmbeddedPatientData !== 'function') {
            throw new Error('Η συνάρτηση getEmbeddedPatientData δεν είναι διαθέσιμη');
        }

        const data = getEmbeddedPatientData();
        
        if (!this.validateData(data)) {
            throw new Error('Μη έγκυρα embedded δεδομένα');
        }

        return data;
    }

    /**
     * Φόρτωση από LocalStorage
     */
    async loadFromLocalStorage() {
        const keys = ['patientsData', 'patients_backup', 'stomadiagnosis_patients'];
        
        for (const key of keys) {
            try {
                const storedData = storageGet(key, null);
                if (!storedData) continue;

                const data = JSON.parse(storedData);
                
                // Μετατροπή σε αναμενόμενη μορφή αν χρειάζεται
                const normalizedData = this.normalizeLocalStorageData(data);
                
                if (this.validateData(normalizedData)) {
                    console.log(`✅ Επιτυχής φόρτωση από localStorage (${key})`);
                    return normalizedData;
                }
            } catch (error) {
                console.warn(`⚠️ Σφάλμα φόρτωσης από localStorage (${key}):`, error.message);
                continue;
            }
        }
        
        throw new Error('Δεν βρέθηκαν έγκυρα δεδομένα στο localStorage');
    }

    /**
     * Κανονικοποίηση δεδομένων από localStorage
     */
    normalizeLocalStorageData(data) {
        // Αν τα δεδομένα είναι ήδη σε σωστή μορφή
        if (data.patients && Array.isArray(data.patients)) {
            return data;
        }
        
        // Αν τα δεδομένα είναι απλός πίνακας ασθενών
        if (Array.isArray(data)) {
            return {
                patients: data,
                metadata: {
                    source: 'localStorage',
                    totalPatients: data.length,
                    lastUpdated: new Date().toISOString()
                }
            };
        }
        
        // Αν τα δεδομένα έχουν διαφορετική δομή
        if (data.data && Array.isArray(data.data)) {
            return {
                patients: data.data,
                metadata: data.metadata || {
                    source: 'localStorage',
                    totalPatients: data.data.length,
                    lastUpdated: new Date().toISOString()
                }
            };
        }
        
        throw new Error('Μη αναγνωρίσιμη μορφή δεδομένων localStorage');
    }

    /**
     * Επικύρωση δεδομένων
     */
    validateData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        if (!data.patients || !Array.isArray(data.patients)) {
            return false;
        }

        if (data.patients.length === 0) {
            return false;
        }

        // Έλεγχος ότι τουλάχιστον ένας ασθενής έχει τα βασικά πεδία
        const firstPatient = data.patients[0];
        if (!firstPatient.id && !firstPatient.name && !firstPatient.firstName) {
            return false;
        }

        return true;
    }

    /**
     * Μετατροπή δεδομένων σε αναμενόμενη μορφή
     */
    transformData(rawData) {
        const patients = rawData.patients.map(patient => ({
            id: patient.id || this.generateId(),
            name: patient.firstName || patient.name || 'Άγνωστο',
            surname: patient.lastName || patient.surname || 'Όνομα',
            phone: patient.phone || 'Δεν υπάρχει',
            email: patient.email || '',
            age: patient.age === '-' ? 'Άγνωστη' : patient.age || 'Άγνωστη',
            lastVisit: patient.lastVisit || patient.registrationDate || '',
            totalMeasurements: patient.totalMeasurements || 0,
            status: patient.isActive === '1' || patient.status === 'active' ? 'active' : 'inactive',
            profession: patient.profession || '',
            attendingDoctor: patient.attendingDoctor || '',
            registrationDate: patient.registrationDate || '',
            amka: patient.amka || '',
            address: patient.address || ''
        }));

        const metadata = {
            totalPatients: patients.length,
            source: this.loadedSource,
            lastUpdated: new Date().toISOString(),
            version: `1.0.0 - ${this.loadedSource} Mode`,
            originalMetadata: rawData.metadata || {}
        };

        return { patients, metadata };
    }

    /**
     * Δημιουργία μοναδικού ID
     */
    generateId() {
        return 'patient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Αποθήκευση δεδομένων στο localStorage ως backup
     */
    async saveToLocalStorage(data, key = 'patientsData_backup') {
        try {
            const dataToStore = {
                ...data,
                savedAt: new Date().toISOString(),
                source: this.loadedSource
            };
            
            localStorageSet(key, dataToStore);
            console.log(`💾 Δεδομένα αποθηκεύτηκαν στο localStorage (${key})`);
        } catch (error) {
            console.warn('⚠️ Αποτυχία αποθήκευσης στο localStorage:', error.message);
        }
    }

    /**
     * Λήψη πληροφοριών φόρτωσης
     */
    getLoadInfo() {
        return {
            source: this.loadedSource,
            fallbackOrder: this.fallbackOrder,
            availableSources: this.jsonSources
        };
    }

    /**
     * Επανάληψη φόρτωσης με καθυστέρηση
     */
    async retryLoad(attempts = this.retryAttempts) {
        for (let i = 0; i < attempts; i++) {
            try {
                console.log(`🔄 Προσπάθεια ${i + 1}/${attempts}`);
                return await this.loadPatientData();
            } catch (error) {
                if (i === attempts - 1) throw error;
                
                console.log(`⏳ Αναμονή ${this.retryDelay}ms πριν την επόμενη προσπάθεια...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }
}

// Export για χρήση σε άλλα αρχεία
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}