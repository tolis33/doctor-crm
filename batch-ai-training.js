/**
 * 🤖 Σύστημα Μαζικής Εκπαίδευσης AI
 * Batch AI Training System
 * 
 * Χαρακτηριστικά:
 * - Μαζική εκπαίδευση με 50+ ασθενείς
 * - Εξαγωγή δεδομένων από X-rays, μετρήσεις, διαδικασίες, παθολογίες
 * - Αυτόματη μορφοποίηση για AI training
 * - Progress tracking και statistics
 * - Batch management και αποθήκευση αποτελεσμάτων
 */

class BatchAITraining {
    constructor() {
        this.isProcessing = false;
        this.currentBatch = null;
        this.progress = 0;
        this.results = [];
        this.minPatientsForTraining = 50;
        this.maxBatchSize = 100;
        this.localStorage = null;
        
        this.initializeStorage();
    }

    /**
     * Αρχικοποίηση συστήματος αποθήκευσης
     */
    async initializeStorage() {
        if (window.LocalPatientStorage) {
            this.localStorage = new LocalPatientStorage();
        } else if (window.localStorage && window.localStorage.constructor === LocalPatientStorage) {
            this.localStorage = window.localStorage;
        } else {
            console.warn('⚠️ LocalPatientStorage δεν είναι διαθέσιμο - χρήση fallback');
        }
    }

    /**
     * Έλεγχος αν υπάρχουν αρκετοί ασθενείς για εκπαίδευση
     */
    async checkTrainingReadiness() {
        try {
            let patients = [];
            
            if (this.localStorage) {
                patients = await this.localStorage.listPatients();
            } else {
                // Fallback - χρήση embedded patients
                if (window.patientsData) {
                    patients = Object.values(window.patientsData).map(patient => ({
                        id: patient.patient?.id || patient.id,
                        name: patient.patient?.name || patient.name || 'Άγνωστος',
                        data: patient
                    }));
                }
            }
            
            const eligiblePatients = await this.getEligiblePatients(patients);
            
            return {
                ready: eligiblePatients.length >= this.minPatientsForTraining,
                totalPatients: patients.length,
                eligiblePatients: eligiblePatients.length,
                minRequired: this.minPatientsForTraining,
                patients: eligiblePatients
            };
        } catch (error) {
            console.error('❌ Σφάλμα ελέγχου ετοιμότητας εκπαίδευσης:', error);
            return { ready: false, error: error.message };
        }
    }

    /**
     * Φιλτράρισμα ασθενών που είναι κατάλληλοι για εκπαίδευση
     */
    async getEligiblePatients(patients) {
        const eligible = [];
        
        for (const patient of patients) {
            try {
                let patientData;
                
                if (this.localStorage && patient.id) {
                    patientData = await this.localStorage.loadPatient(patient.id);
                } else {
                    patientData = patient.data || patient;
                }
                
                if (this.isPatientEligible(patientData)) {
                    eligible.push({
                        id: patient.id || patientData.patient?.id || patientData.id,
                        name: patient.name || patientData.patient?.name || patientData.name || 'Άγνωστος',
                        data: patientData
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Σφάλμα φόρτωσης ασθενή ${patient.id}:`, error);
            }
        }
        
        return eligible;
    }

    /**
     * Έλεγχος αν ο ασθενής είναι κατάλληλος για εκπαίδευση
     */
    isPatientEligible(patientData) {
        if (!patientData) return false;
        
        // Έλεγχος για διαθέσιμα δεδομένα
        const dentalRecords = patientData.dentalRecords || patientData;
        
        const hasXrays = dentalRecords.xrays && dentalRecords.xrays.length > 0;
        const hasMeasurements = dentalRecords.measurements && Object.keys(dentalRecords.measurements).length > 0;
        const hasProcedures = dentalRecords.procedures && dentalRecords.procedures.length > 0;
        const hasPathologies = dentalRecords.pathologies && dentalRecords.pathologies.length > 0;
        const hasToothData = dentalRecords.toothData && Object.keys(dentalRecords.toothData).length > 0;
        
        // Τουλάχιστον 2 από τα παραπάνω
        const criteriaCount = [hasXrays, hasMeasurements, hasProcedures, hasPathologies, hasToothData].filter(Boolean).length;
        
        return criteriaCount >= 2;
    }

    /**
     * Ξεκίνημα μαζικής εκπαίδευσης
     */
    async startBatchTraining(options = {}) {
        if (this.isProcessing) {
            throw new Error('Η μαζική εκπαίδευση είναι ήδη σε εξέλιξη');
        }

        try {
            this.isProcessing = true;
            this.progress = 0;
            this.results = [];

            // Έλεγχος ετοιμότητας
            const readiness = await this.checkTrainingReadiness();
            if (!readiness.ready) {
                throw new Error(`Χρειάζονται τουλάχιστον ${this.minPatientsForTraining} κατάλληλοι ασθενείς. Διαθέσιμοι: ${readiness.eligiblePatients}`);
            }

            // Δημιουργία batch
            this.currentBatch = {
                id: this.generateBatchId(),
                startTime: new Date().toISOString(),
                patients: readiness.patients.slice(0, this.maxBatchSize),
                options: {
                    includeXrays: options.includeXrays !== false,
                    includeMeasurements: options.includeMeasurements !== false,
                    includeProcedures: options.includeProcedures !== false,
                    includePathologies: options.includePathologies !== false,
                    includeToothData: options.includeToothData !== false,
                    ...options
                },
                status: 'processing'
            };

            console.log(`🚀 Ξεκίνημα μαζικής εκπαίδευσης με ${this.currentBatch.patients.length} ασθενείς`);

            // Επεξεργασία ασθενών
            await this.processBatch();

            // Εκπαίδευση AI
            await this.trainAIModel();

            // Ολοκλήρωση
            this.currentBatch.endTime = new Date().toISOString();
            this.currentBatch.status = 'completed';

            const result = {
                batchId: this.currentBatch.id,
                processedPatients: this.results.length,
                successRate: this.calculateSuccessRate(),
                trainingData: this.results,
                duration: this.calculateDuration(),
                status: 'success'
            };

            // Αποθήκευση αποτελεσμάτων
            await this.saveBatchResults(result);

            return result;

        } catch (error) {
            console.error('❌ Σφάλμα μαζικής εκπαίδευσης:', error);
            
            if (this.currentBatch) {
                this.currentBatch.status = 'failed';
                this.currentBatch.error = error.message;
            }

            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Επεξεργασία batch ασθενών
     */
    async processBatch() {
        const totalPatients = this.currentBatch.patients.length;
        
        for (let i = 0; i < totalPatients; i++) {
            const patient = this.currentBatch.patients[i];
            
            try {
                console.log(`📊 Επεξεργασία ασθενή ${i + 1}/${totalPatients}: ${patient.name}`);
                
                const trainingData = await this.extractTrainingData(patient);
                
                if (trainingData && trainingData.length > 0) {
                    this.results.push(...trainingData);
                    console.log(`✅ Εξήχθησαν ${trainingData.length} δεδομένα εκπαίδευσης από ασθενή ${patient.name}`);
                } else {
                    console.warn(`⚠️ Δεν εξήχθησαν δεδομένα από ασθενή ${patient.name}`);
                }
                
            } catch (error) {
                console.error(`❌ Σφάλμα επεξεργασίας ασθενή ${patient.name}:`, error);
            }
            
            // Ενημέρωση προόδου
            this.progress = Math.round(((i + 1) / totalPatients) * 50); // 50% για επεξεργασία
            this.notifyProgress();
        }
    }

    /**
     * Εξαγωγή δεδομένων εκπαίδευσης από ασθενή
     */
    async extractTrainingData(patient) {
        const trainingData = [];
        const patientData = patient.data;
        const options = this.currentBatch.options;

        try {
            const dentalRecords = patientData.dentalRecords || patientData;

            // Εξαγωγή από X-rays
            if (options.includeXrays && dentalRecords.xrays) {
                const xrayData = await this.extractXrayTrainingData(patientData);
                trainingData.push(...xrayData);
            }

            // Εξαγωγή από μετρήσεις
            if (options.includeMeasurements && dentalRecords.measurements) {
                const measurementData = await this.extractMeasurementTrainingData(patientData);
                trainingData.push(...measurementData);
            }

            // Εξαγωγή από διαδικασίες
            if (options.includeProcedures && dentalRecords.procedures) {
                const procedureData = await this.extractProcedureTrainingData(patientData);
                trainingData.push(...procedureData);
            }

            // Εξαγωγή από παθολογίες
            if (options.includePathologies && dentalRecords.pathologies) {
                const pathologyData = await this.extractPathologyTrainingData(patientData);
                trainingData.push(...pathologyData);
            }

            // Εξαγωγή από δεδομένα δοντιών
            if (options.includeToothData && dentalRecords.toothData) {
                const toothData = await this.extractToothTrainingData(patientData);
                trainingData.push(...toothData);
            }

            return trainingData;

        } catch (error) {
            console.error(`❌ Σφάλμα εξαγωγής δεδομένων από ασθενή ${patient.name}:`, error);
            return [];
        }
    }

    /**
     * Εξαγωγή δεδομένων εκπαίδευσης από X-rays
     */
    async extractXrayTrainingData(patientData) {
        const trainingData = [];
        const timestamp = new Date().toISOString();
        const userId = this.getCurrentUserId();
        const sessionId = this.getCurrentSessionId();
        const dentalRecords = patientData.dentalRecords || patientData;
        
        for (const xray of dentalRecords.xrays) {
            if (xray.aiAnalysis && xray.aiAnalysis.findings) {
                for (const finding of xray.aiAnalysis.findings) {
                    trainingData.push({
                        type: 'xray_analysis',
                        patientId: patientData.patient?.id || patientData.id,
                        timestamp: timestamp,
                        created_by: userId,
                        session_id: sessionId,
                        input: {
                            xrayType: xray.type,
                            toothNumber: finding.toothNumber,
                            imageData: xray.imageData || xray.imagePath,
                            symptoms: finding.description
                        },
                        output: {
                            diagnosis: finding.diagnosis,
                            confidence: finding.confidence,
                            severity: finding.severity,
                            recommendations: finding.recommendations
                        },
                        metadata: {
                            date: xray.date,
                            source: 'xray',
                            verified: xray.verified || false,
                            batch_id: this.currentBatch?.id,
                            extraction_timestamp: timestamp,
                            data_version: '2.0'
                        }
                    });
                }
            }
        }
        
        return trainingData;
    }

    /**
     * Εξαγωγή δεδομένων εκπαίδευσης από μετρήσεις
     */
    async extractMeasurementTrainingData(patientData) {
        const trainingData = [];
        const timestamp = new Date().toISOString();
        const userId = this.getCurrentUserId();
        const sessionId = this.getCurrentSessionId();
        const dentalRecords = patientData.dentalRecords || patientData;
        
        for (const [toothNumber, measurements] of Object.entries(dentalRecords.measurements)) {
            for (const measurement of measurements) {
                if (measurement.aiCorrelation) {
                    trainingData.push({
                        type: 'measurement_analysis',
                        patientId: patientData.patient?.id || patientData.id,
                        timestamp: timestamp,
                        created_by: userId,
                        session_id: sessionId,
                        input: {
                            toothNumber: toothNumber,
                            measurementType: measurement.type,
                            value: measurement.value,
                            unit: measurement.unit,
                            method: measurement.method
                        },
                        output: {
                            diagnosis: measurement.aiCorrelation.diagnosis,
                            confidence: measurement.aiCorrelation.confidence,
                            normalRange: measurement.aiCorrelation.normalRange,
                            interpretation: measurement.aiCorrelation.interpretation
                        },
                        metadata: {
                            date: measurement.date,
                            source: 'measurement',
                            verified: measurement.verified || false,
                            batch_id: this.currentBatch?.id,
                            extraction_timestamp: timestamp,
                            data_version: '2.0'
                        }
                    });
                }
            }
        }
        
        return trainingData;
    }

    /**
     * Εξαγωγή δεδομένων εκπαίδευσης από διαδικασίες
     */
    async extractProcedureTrainingData(patientData) {
        const trainingData = [];
        const timestamp = new Date().toISOString();
        const userId = this.getCurrentUserId();
        const sessionId = this.getCurrentSessionId();
        const dentalRecords = patientData.dentalRecords || patientData;
        
        for (const procedure of dentalRecords.procedures) {
            if (procedure.outcome && procedure.symptoms) {
                trainingData.push({
                    type: 'procedure_outcome',
                    patientId: patientData.patient?.id || patientData.id,
                    timestamp: timestamp,
                    created_by: userId,
                    session_id: sessionId,
                    input: {
                        symptoms: procedure.symptoms,
                        toothNumber: procedure.toothNumber,
                        procedureType: procedure.type,
                        preCondition: procedure.preCondition
                    },
                    output: {
                        outcome: procedure.outcome,
                        success: procedure.success,
                        complications: procedure.complications,
                        followUp: procedure.followUp
                    },
                    metadata: {
                        date: procedure.date,
                        source: 'procedure',
                        verified: true,
                        batch_id: this.currentBatch?.id,
                        extraction_timestamp: timestamp,
                        data_version: '2.0'
                    }
                });
            }
        }
        
        return trainingData;
    }

    /**
     * Εξαγωγή δεδομένων εκπαίδευσης από παθολογίες
     */
    async extractPathologyTrainingData(patientData) {
        const trainingData = [];
        const timestamp = new Date().toISOString();
        const userId = this.getCurrentUserId();
        const sessionId = this.getCurrentSessionId();
        const dentalRecords = patientData.dentalRecords || patientData;
        
        for (const pathology of dentalRecords.pathologies) {
            trainingData.push({
                type: 'pathology_diagnosis',
                patientId: patientData.patient?.id || patientData.id,
                timestamp: timestamp,
                created_by: userId,
                session_id: sessionId,
                input: {
                    symptoms: pathology.symptoms,
                    toothNumber: pathology.toothNumber,
                    clinicalFindings: pathology.clinicalFindings,
                    patientHistory: pathology.patientHistory
                },
                output: {
                    diagnosis: pathology.diagnosis,
                    severity: pathology.severity,
                    treatment: pathology.treatment,
                    prognosis: pathology.prognosis
                },
                metadata: {
                    date: pathology.date,
                    source: 'pathology',
                    verified: pathology.verified || false,
                    batch_id: this.currentBatch?.id,
                    extraction_timestamp: timestamp,
                    data_version: '2.0'
                }
            });
        }
        
        return trainingData;
    }

    /**
     * Εξαγωγή δεδομένων εκπαίδευσης από δεδομένα δοντιών
     */
    async extractToothTrainingData(patientData) {
        const trainingData = [];
        const timestamp = new Date().toISOString();
        const userId = this.getCurrentUserId();
        const sessionId = this.getCurrentSessionId();
        const dentalRecords = patientData.dentalRecords || patientData;
        
        for (const [toothNumber, toothData] of Object.entries(dentalRecords.toothData)) {
            if (toothData.status && toothData.status !== 'healthy') {
                trainingData.push({
                    type: 'tooth_condition',
                    patientId: patientData.patient?.id || patientData.id,
                    timestamp: timestamp,
                    created_by: userId,
                    session_id: sessionId,
                    input: {
                        toothNumber: toothNumber,
                        symptoms: toothData.notes || toothData.symptoms || '',
                        conditions: toothData.conditions || [],
                        interventions: toothData.interventions || []
                    },
                    output: {
                        status: toothData.status,
                        diagnosis: toothData.diagnosis || toothData.status,
                        treatment: toothData.treatment || '',
                        prognosis: toothData.prognosis || 'good'
                    },
                    metadata: {
                        date: toothData.lastUpdated || timestamp,
                        source: 'tooth_data',
                        verified: true,
                        batch_id: this.currentBatch?.id,
                        extraction_timestamp: timestamp,
                        data_version: '2.0'
                    }
                });
            }
        }
        
        return trainingData;
    }

    /**
     * Εκπαίδευση AI μοντέλου
     */
    async trainAIModel() {
        console.log(`🤖 Ξεκίνημα εκπαίδευσης AI με ${this.results.length} δεδομένα`);
        
        try {
            // Προετοιμασία δεδομένων εκπαίδευσης
            const formattedData = this.formatTrainingData();
            
            // Χρήση υπάρχοντος AI training system
            if (window.aiTrainingUI && window.aiTrainingUI.isInitialized) {
                await window.aiTrainingUI.batchTraining(formattedData);
            } else if (window.aiBackend && window.aiBackend.isConnected) {
                await window.aiBackend.batchTraining(formattedData);
            } else {
                // Fallback σε τοπική εκπαίδευση
                await this.localAITraining(formattedData);
            }
            
            this.progress = 100;
            this.notifyProgress();
            
            console.log('✅ Εκπαίδευση AI ολοκληρώθηκε επιτυχώς');
            
        } catch (error) {
            console.error('❌ Σφάλμα εκπαίδευσης AI:', error);
            throw error;
        }
    }

    /**
     * Μορφοποίηση δεδομένων για εκπαίδευση
     */
    formatTrainingData() {
        return this.results.map(item => ({
            id: `${item.patientId}_${item.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            patientId: item.patientId,
            category: item.type,
            symptoms: this.formatSymptoms(item.input),
            diagnosis: this.formatDiagnosis(item.output),
            treatment: item.output.treatment || item.output.recommendations || '',
            confidence: item.output.confidence || 85,
            notes: `Εξήχθη από ${item.metadata.source} - ${item.metadata.date}`,
            includeXray: item.type === 'xray_analysis',
            date: item.metadata.date,
            verified: item.metadata.verified,
            createdAt: new Date().toISOString()
        }));
    }

    /**
     * Μορφοποίηση συμπτωμάτων
     */
    formatSymptoms(input) {
        const symptoms = [];
        
        if (input.symptoms) symptoms.push(input.symptoms);
        if (input.toothNumber) symptoms.push(`Δόντι ${input.toothNumber}`);
        if (input.measurementType) symptoms.push(`${input.measurementType}: ${input.value} ${input.unit}`);
        if (input.procedureType) symptoms.push(`Διαδικασία: ${input.procedureType}`);
        if (input.clinicalFindings) symptoms.push(input.clinicalFindings);
        if (input.conditions && input.conditions.length > 0) symptoms.push(`Καταστάσεις: ${input.conditions.join(', ')}`);
        
        return symptoms.join(', ');
    }

    /**
     * Μορφοποίηση διάγνωσης
     */
    formatDiagnosis(output) {
        if (output.diagnosis) return output.diagnosis;
        if (output.outcome) return output.outcome;
        if (output.interpretation) return output.interpretation;
        if (output.status) return output.status;
        return 'Άγνωστη διάγνωση';
    }

    /**
     * Τοπική εκπαίδευση AI (fallback)
     */
    async localAITraining(formattedData) {
        // Προσθήκη στα υπάρχοντα δεδομένα εκπαίδευσης
        if (window.aiTrainingData) {
            window.aiTrainingData.push(...formattedData);
            
            // Αποθήκευση
            if (window.saveAITrainingData) {
                window.saveAITrainingData();
            }
            
            // Ξεκίνημα εκπαίδευσης
            if (window.startAITraining) {
                await window.startAITraining();
            }
        } else {
            // Δημιουργία νέου training dataset
            window.aiTrainingData = formattedData;
            console.log(`📚 Δημιουργήθηκε νέο training dataset με ${formattedData.length} εγγραφές`);
        }
        
        // Προσομοίωση προόδου εκπαίδευσης
        for (let i = 50; i <= 100; i += 5) {
            this.progress = i;
            this.notifyProgress();
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    /**
     * Υπολογισμός ποσοστού επιτυχίας
     */
    calculateSuccessRate() {
        if (this.results.length === 0) return 0;
        
        const successful = this.results.filter(item => 
            item.metadata.verified || 
            (item.output.confidence && item.output.confidence > 70)
        ).length;
        
        return Math.round((successful / this.results.length) * 100);
    }

    /**
     * Υπολογισμός διάρκειας
     */
    calculateDuration() {
        if (!this.currentBatch || !this.currentBatch.startTime) return 0;
        
        const start = new Date(this.currentBatch.startTime);
        const end = this.currentBatch.endTime ? new Date(this.currentBatch.endTime) : new Date();
        
        return Math.round((end - start) / 1000); // σε δευτερόλεπτα
    }

    /**
     * Αποθήκευση αποτελεσμάτων batch
     */
    async saveBatchResults(result) {
        try {
            const filename = `batch_training_${result.batchId}.json`;
            
            const fullResult = {
                ...result,
                batch: this.currentBatch,
                timestamp: new Date().toISOString()
            };
            
            if (this.localStorage && this.localStorage.saveFile) {
                const filepath = `./backups/${filename}`;
                await this.localStorage.saveFile(filepath, fullResult);
            } else {
                // Fallback σε localStorage
                const key = `batch_training_${result.batchId}`;
                localStorageSet(key, fullResult);
            }
            
            console.log(`✅ Αποτελέσματα batch αποθηκεύτηκαν: ${filename}`);
            
        } catch (error) {
            console.error('❌ Σφάλμα αποθήκευσης αποτελεσμάτων:', error);
        }
    }

    /**
     * Ειδοποίηση προόδου
     */
    notifyProgress() {
        // Dispatch custom event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('batchTrainingProgress', {
                detail: {
                    progress: this.progress,
                    currentBatch: this.currentBatch,
                    results: this.results.length
                }
            }));
        }
        
        // Console log
        console.log(`📊 Πρόοδος μαζικής εκπαίδευσης: ${this.progress}%`);
    }

    /**
     * Δημιουργία μοναδικού ID για batch
     */
    generateBatchId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = Math.random().toString(36).substr(2, 6);
        return `batch_${timestamp}_${random}`;
    }

    /**
     * Ακύρωση τρέχουσας εκπαίδευσης
     */
    async cancelTraining() {
        if (!this.isProcessing) {
            throw new Error('Δεν υπάρχει ενεργή εκπαίδευση για ακύρωση');
        }
        
        this.isProcessing = false;
        
        if (this.currentBatch) {
            this.currentBatch.status = 'cancelled';
            this.currentBatch.endTime = new Date().toISOString();
        }
        
        console.log('⚠️ Μαζική εκπαίδευση ακυρώθηκε');
    }

    /**
     * Λήψη στατιστικών
     */
    getStatistics() {
        return {
            isProcessing: this.isProcessing,
            progress: this.progress,
            currentBatch: this.currentBatch,
            resultsCount: this.results.length,
            minPatientsRequired: this.minPatientsForTraining,
            maxBatchSize: this.maxBatchSize
        };
    }

    /**
     * Λήψη τρέχοντος user ID
     */
    getCurrentUserId() {
        // Έλεγχος για Node.js περιβάλλον
        if (typeof process !== 'undefined' && process.env) {
            return process.env.USER_ID || process.env.USERNAME || 'system';
        }
        
        // Έλεγχος για browser περιβάλλον
        if (typeof window !== 'undefined') {
            // Έλεγχος για global user object
            if (window.currentUser && window.currentUser.id) {
                return window.currentUser.id;
            }
            
            // Έλεγχος για session storage
            const sessionUser = sessionStorage.getItem('currentUser');
            if (sessionUser) {
                try {
                    const user = JSON.parse(sessionUser);
                    return user.id || user.username;
                } catch (e) {
                    console.warn('Σφάλμα parsing user από session storage:', e);
                }
            }
            
            // Έλεγχος για local storage
            const localUser = storageGet('currentUser', null);
            if (localUser) {
                try {
                    const user = JSON.parse(localUser);
                    return user.id || user.username;
                } catch (e) {
                    console.warn('Σφάλμα parsing user από local storage:', e);
                }
            }
        }
        
        // Fallback
        return 'anonymous_user';
    }

    /**
     * Λήψη τρέχοντος session ID
     */
    getCurrentSessionId() {
        // Έλεγχος για υπάρχον session ID
        if (typeof window !== 'undefined') {
            // Έλεγχος για global session object
            if (window.currentSession && window.currentSession.id) {
                return window.currentSession.id;
            }
            
            // Έλεγχος για session storage
            let sessionId = sessionStorage.getItem('sessionId');
            if (sessionId) {
                return sessionId;
            }
            
            // Δημιουργία νέου session ID
            sessionId = this.generateSessionId();
            sessionStorageSet('sessionId', sessionId);
            return sessionId;
        }
        
        // Fallback για Node.js
        return this.generateSessionId();
    }

    /**
     * Δημιουργία νέου session ID
     */
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `session_${timestamp}_${random}`;
    }
}

// Export για χρήση
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BatchAITraining;
} else {
    window.BatchAITraining = BatchAITraining;
}