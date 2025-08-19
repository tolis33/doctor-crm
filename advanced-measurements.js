/**
 * 📏 Προηγμένο Σύστημα Μετρήσεων
 * Advanced Measurements System
 * 
 * Χαρακτηριστικά:
 * - 10+ τύποι μετρήσεων (μήκος ρίζας, πλάτος κορώνας, βάθος θύλακα κ.ά.)
 * - AI scoring και confidence levels
 * - Αυτόματη ανάλυση από X-rays
 * - Χειροκίνητες και AI μετρήσεις
 * - Στατιστικά και αναφορές
 * - Εξαγωγή δεδομένων
 */

class AdvancedMeasurementsSystem {
    constructor() {
        this.patientData = null;
        this.measurementTypes = this.initializeMeasurementTypes();
        this.aiConfidenceThreshold = 70;
        this.normalRanges = this.initializeNormalRanges();
        this.measurementHistory = [];
        
        this.initializeEventListeners();
    }

    /**
     * Αρχικοποίηση τύπων μετρήσεων
     */
    initializeMeasurementTypes() {
        return {
            // Μετρήσεις Ρίζας
            root_length_mm: {
                name: 'Μήκος Ρίζας',
                unit: 'mm',
                category: 'root',
                normalRange: { min: 10, max: 25 },
                description: 'Μήκος από την κορυφή της ρίζας έως τον αυχένα του δοντιού'
            },
            root_width_mm: {
                name: 'Πλάτος Ρίζας',
                unit: 'mm',
                category: 'root',
                normalRange: { min: 3, max: 8 },
                description: 'Μέγιστο πλάτος της ρίζας'
            },
            apex_width_mm: {
                name: 'Πλάτος Κορυφής Ρίζας',
                unit: 'mm',
                category: 'root',
                normalRange: { min: 0.3, max: 1.5 },
                description: 'Διάμετρος του τρήματος της κορυφής'
            },
            
            // Μετρήσεις Κορώνας
            crown_height_mm: {
                name: 'Ύψος Κορώνας',
                unit: 'mm',
                category: 'crown',
                normalRange: { min: 6, max: 12 },
                description: 'Ύψος από τον αυχένα έως την κορυφή της κορώνας'
            },
            crown_width_mm: {
                name: 'Πλάτος Κορώνας',
                unit: 'mm',
                category: 'crown',
                normalRange: { min: 6, max: 14 },
                description: 'Μέγιστο πλάτος της κορώνας'
            },
            
            // Μετρήσεις Πολφού
            pulp_chamber_height_mm: {
                name: 'Ύψος Θαλάμου Πολφού',
                unit: 'mm',
                category: 'pulp',
                normalRange: { min: 2, max: 6 },
                description: 'Ύψος του θαλάμου του πολφού'
            },
            canal_length_mm: {
                name: 'Μήκος Καναλιού',
                unit: 'mm',
                category: 'pulp',
                normalRange: { min: 15, max: 25 },
                description: 'Μήκος του ριζικού καναλιού'
            },
            
            // Περιοδοντικές Μετρήσεις
            pocket_depth_mm: {
                name: 'Βάθος Θύλακα',
                unit: 'mm',
                category: 'periodontal',
                normalRange: { min: 1, max: 3 },
                description: 'Βάθος του περιοδοντικού θύλακα'
            },
            attachment_loss_mm: {
                name: 'Απώλεια Πρόσφυσης',
                unit: 'mm',
                category: 'periodontal',
                normalRange: { min: 0, max: 2 },
                description: 'Απώλεια επιθηλιακής πρόσφυσης'
            },
            bone_level_mm: {
                name: 'Επίπεδο Οστού',
                unit: 'mm',
                category: 'periodontal',
                normalRange: { min: 0, max: 3 },
                description: 'Απόσταση από την αμελοοδοντική συμβολή'
            },
            
            // Κλινικές Μετρήσεις
            mobility_grade: {
                name: 'Βαθμός Κινητικότητας',
                unit: 'grade',
                category: 'clinical',
                normalRange: { min: 0, max: 1 },
                description: 'Βαθμός κινητικότητας δοντιού (0-3)'
            },
            bleeding_index: {
                name: 'Δείκτης Αιμορραγίας',
                unit: '%',
                category: 'clinical',
                normalRange: { min: 0, max: 10 },
                description: 'Ποσοστό αιμορραγίας κατά τη διερεύνηση'
            },
            plaque_index: {
                name: 'Δείκτης Πλάκας',
                unit: '%',
                category: 'clinical',
                normalRange: { min: 0, max: 20 },
                description: 'Ποσοστό επιφάνειας με πλάκα'
            },
            
            // Παθολογικές Μετρήσεις
            caries_depth_mm: {
                name: 'Βάθος Τερηδόνας',
                unit: 'mm',
                category: 'pathology',
                normalRange: { min: 0, max: 0 },
                description: 'Βάθος τερηδονικής βλάβης'
            }
        };
    }

    /**
     * Αρχικοποίηση φυσιολογικών τιμών
     */
    initializeNormalRanges() {
        const ranges = {};
        Object.entries(this.measurementTypes).forEach(([type, config]) => {
            ranges[type] = config.normalRange;
        });
        return ranges;
    }

    /**
     * Αρχικοποίηση event listeners
     */
    initializeEventListeners() {
        if (typeof window !== 'undefined') {
            window.addEventListener('measurementAdded', (event) => {
                this.onMeasurementAdded(event.detail);
            });
            
            window.addEventListener('aiAnalysisComplete', (event) => {
                this.onAIAnalysisComplete(event.detail);
            });
        }
    }

    /**
     * Ρύθμιση δεδομένων ασθενή
     */
    setPatientData(patientData) {
        this.patientData = patientData;
        
        // Αρχικοποίηση measurements αν δεν υπάρχουν
        if (!this.patientData.measurements) {
            this.patientData.measurements = {};
        }
        
        console.log('✅ Δεδομένα ασθενή ρυθμίστηκαν για Advanced Measurements System');
    }

    /**
     * Προσθήκη μέτρησης
     */
    addMeasurement(toothNumber, measurementData) {
        if (!this.patientData) {
            throw new Error('Δεν έχουν ρυθμιστεί δεδομένα ασθενή');
        }

        const toothKey = `tooth_${toothNumber}`;
        
        // Αρχικοποίηση δοντιού αν δεν υπάρχει
        if (!this.patientData.measurements[toothKey]) {
            this.patientData.measurements[toothKey] = {};
        }

        // Δημιουργία μοναδικού ID
        const measurementId = this.generateMeasurementId();
        
        // Επικύρωση τύπου μέτρησης
        if (!this.measurementTypes[measurementData.type]) {
            throw new Error(`Άγνωστος τύπος μέτρησης: ${measurementData.type}`);
        }

        // Δημιουργία αντικειμένου μέτρησης
        const measurement = {
            id: measurementId,
            type: measurementData.type,
            value: parseFloat(measurementData.value),
            unit: this.measurementTypes[measurementData.type].unit,
            method: measurementData.method || 'manual',
            date: measurementData.date || new Date().toISOString().split('T')[0],
            notes: measurementData.notes || '',
            measuredBy: measurementData.measuredBy || this.getCurrentUser(),
            aiConfidence: measurementData.aiConfidence || null,
            xrayId: measurementData.xrayId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            // Προηγμένα πεδία
            category: this.measurementTypes[measurementData.type].category,
            normalRange: this.measurementTypes[measurementData.type].normalRange,
            isNormal: this.isValueNormal(measurementData.type, measurementData.value),
            aiScore: this.calculateAIScore(measurementData),
            reliability: this.calculateReliability(measurementData)
        };

        // Αποθήκευση μέτρησης
        this.patientData.measurements[toothKey][measurementData.type] = measurement;
        
        // Προσθήκη στο ιστορικό
        this.addToHistory('add', toothNumber, measurement);
        
        // Dispatch event
        this.dispatchMeasurementEvent('measurementAdded', {
            toothNumber,
            measurement,
            patientId: this.patientData.id
        });

        console.log(`✅ Προστέθηκε μέτρηση ${measurementData.type} για δόντι ${toothNumber}`);
        return measurementId;
    }

    /**
     * Ενημέρωση μέτρησης
     */
    updateMeasurement(toothNumber, measurementType, updateData) {
        if (!this.patientData || !this.patientData.measurements) {
            throw new Error('Δεν υπάρχουν δεδομένα μετρήσεων');
        }

        const toothKey = `tooth_${toothNumber}`;
        
        if (!this.patientData.measurements[toothKey] || !this.patientData.measurements[toothKey][measurementType]) {
            throw new Error(`Δεν βρέθηκε μέτρηση ${measurementType} για δόντι ${toothNumber}`);
        }

        const oldMeasurement = { ...this.patientData.measurements[toothKey][measurementType] };
        
        // Ενημέρωση πεδίων
        Object.keys(updateData).forEach(field => {
            if (updateData[field] !== undefined) {
                this.patientData.measurements[toothKey][measurementType][field] = updateData[field];
            }
        });

        // Ενημέρωση timestamp
        this.patientData.measurements[toothKey][measurementType].updatedAt = new Date().toISOString();
        
        // Επανυπολογισμός προηγμένων πεδίων
        if (updateData.value !== undefined) {
            const measurement = this.patientData.measurements[toothKey][measurementType];
            measurement.isNormal = this.isValueNormal(measurementType, updateData.value);
            measurement.aiScore = this.calculateAIScore(measurement);
            measurement.reliability = this.calculateReliability(measurement);
        }

        // Προσθήκη στο ιστορικό
        this.addToHistory('update', toothNumber, {
            oldValue: oldMeasurement.value,
            newValue: this.patientData.measurements[toothKey][measurementType].value,
            type: measurementType,
            updatedFields: Object.keys(updateData)
        });

        console.log(`✅ Ενημερώθηκε μέτρηση ${measurementType} για δόντι ${toothNumber}`);
        return true;
    }

    /**
     * Διαγραφή μέτρησης
     */
    removeMeasurement(toothNumber, measurementType) {
        if (!this.patientData || !this.patientData.measurements) {
            throw new Error('Δεν υπάρχουν δεδομένα μετρήσεων');
        }

        const toothKey = `tooth_${toothNumber}`;
        
        if (!this.patientData.measurements[toothKey] || !this.patientData.measurements[toothKey][measurementType]) {
            throw new Error(`Δεν βρέθηκε μέτρηση ${measurementType} για δόντι ${toothNumber}`);
        }

        const removedMeasurement = this.patientData.measurements[toothKey][measurementType];
        delete this.patientData.measurements[toothKey][measurementType];

        // Διαγραφή δοντιού αν δεν έχει άλλες μετρήσεις
        if (Object.keys(this.patientData.measurements[toothKey]).length === 0) {
            delete this.patientData.measurements[toothKey];
        }

        // Προσθήκη στο ιστορικό
        this.addToHistory('remove', toothNumber, removedMeasurement);

        // Dispatch event
        this.dispatchMeasurementEvent('measurementRemoved', {
            toothNumber,
            measurementType,
            removedMeasurement,
            patientId: this.patientData.id
        });

        console.log(`✅ Διαγράφηκε μέτρηση ${measurementType} από δόντι ${toothNumber}`);
        return true;
    }

    /**
     * Λήψη μετρήσεων δοντιού
     */
    getToothMeasurements(toothNumber) {
        if (!this.patientData || !this.patientData.measurements) {
            return {};
        }

        const toothKey = `tooth_${toothNumber}`;
        return this.patientData.measurements[toothKey] || {};
    }

    /**
     * Λήψη συγκεκριμένης μέτρησης
     */
    getSpecificMeasurement(toothNumber, measurementType) {
        const toothMeasurements = this.getToothMeasurements(toothNumber);
        return toothMeasurements[measurementType] || null;
    }

    /**
     * Λήψη όλων των μετρήσεων
     */
    getAllMeasurements() {
        return this.patientData && this.patientData.measurements ? this.patientData.measurements : {};
    }

    /**
     * Προσθήκη AI μετρήσεων από ακτινογραφία
     */
    addAIMeasurements(toothNumber, aiResults, xrayId = null) {
        if (!aiResults || typeof aiResults !== 'object') {
            throw new Error('Μη έγκυρα αποτελέσματα AI');
        }

        const addedMeasurements = [];

        Object.entries(aiResults).forEach(([measurementType, result]) => {
            if (this.measurementTypes[measurementType] && result.value !== undefined) {
                try {
                    const measurementData = {
                        type: measurementType,
                        value: result.value,
                        method: 'ai_analysis',
                        aiConfidence: result.confidence || 85,
                        xrayId: xrayId,
                        notes: `AI ανάλυση από ακτινογραφία ${xrayId || 'unknown'}`,
                        measuredBy: 'AI System'
                    };

                    const measurementId = this.addMeasurement(toothNumber, measurementData);
                    addedMeasurements.push({
                        id: measurementId,
                        type: measurementType,
                        value: result.value,
                        confidence: result.confidence
                    });
                } catch (error) {
                    console.error(`❌ Σφάλμα προσθήκης AI μέτρησης ${measurementType}:`, error);
                }
            }
        });

        return addedMeasurements;
    }

    /**
     * Δημιουργία σύνοψης μετρήσεων
     */
    generateMeasurementSummary() {
        const measurements = this.getAllMeasurements();
        const summary = {
            totalMeasurements: 0,
            teethWithMeasurements: 0,
            aiGeneratedCount: 0,
            manualCount: 0,
            xrayAnalysisCount: 0,
            averageConfidence: 0,
            categorySummary: {},
            abnormalMeasurements: 0,
            highConfidenceMeasurements: 0,
            recentMeasurements: 0
        };

        let totalConfidence = 0;
        let confidenceCount = 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        Object.entries(measurements).forEach(([toothKey, toothMeasurements]) => {
            if (Object.keys(toothMeasurements).length > 0) {
                summary.teethWithMeasurements++;
            }

            Object.entries(toothMeasurements).forEach(([measurementType, measurement]) => {
                summary.totalMeasurements++;

                // Μέθοδος μέτρησης
                if (measurement.method === 'ai_analysis') {
                    summary.aiGeneratedCount++;
                } else if (measurement.method === 'xray_analysis') {
                    summary.xrayAnalysisCount++;
                } else {
                    summary.manualCount++;
                }

                // AI Confidence
                if (measurement.aiConfidence) {
                    totalConfidence += measurement.aiConfidence;
                    confidenceCount++;
                    
                    if (measurement.aiConfidence >= this.aiConfidenceThreshold) {
                        summary.highConfidenceMeasurements++;
                    }
                }

                // Κατηγορία
                const category = measurement.category || 'unknown';
                if (!summary.categorySummary[category]) {
                    summary.categorySummary[category] = 0;
                }
                summary.categorySummary[category]++;

                // Φυσιολογικές τιμές
                if (!measurement.isNormal) {
                    summary.abnormalMeasurements++;
                }

                // Πρόσφατες μετρήσεις
                const measurementDate = new Date(measurement.createdAt);
                if (measurementDate >= oneWeekAgo) {
                    summary.recentMeasurements++;
                }
            });
        });

        // Υπολογισμός μέσου όρου confidence
        summary.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

        return summary;
    }

    /**
     * Δημιουργία αναφοράς μετρήσεων
     */
    generateMeasurementReport(options = {}) {
        const summary = this.generateMeasurementSummary();
        const measurements = this.getAllMeasurements();
        
        const report = {
            patientInfo: {
                id: this.patientData?.id || 'N/A',
                name: this.patientData?.name || 'N/A',
                age: this.patientData?.age || 'N/A',
                gender: this.patientData?.gender || 'N/A'
            },
            reportDate: new Date().toISOString(),
            summary: summary,
            detailedMeasurements: {},
            recommendations: [],
            riskAssessment: this.calculateRiskAssessment(summary),
            qualityScore: this.calculateQualityScore(summary)
        };

        // Λεπτομερείς μετρήσεις
        Object.entries(measurements).forEach(([toothKey, toothMeasurements]) => {
            const toothNumber = toothKey.replace('tooth_', '');
            report.detailedMeasurements[toothNumber] = {};

            Object.entries(toothMeasurements).forEach(([measurementType, measurement]) => {
                report.detailedMeasurements[toothNumber][measurementType] = {
                    value: measurement.value,
                    unit: measurement.unit,
                    isNormal: measurement.isNormal,
                    method: measurement.method,
                    confidence: measurement.aiConfidence,
                    date: measurement.date,
                    reliability: measurement.reliability
                };
            });
        });

        // Συστάσεις
        report.recommendations = this.generateRecommendations(summary, measurements);

        return report;
    }

    /**
     * Έλεγχος αν η τιμή είναι φυσιολογική
     */
    isValueNormal(measurementType, value) {
        const normalRange = this.normalRanges[measurementType];
        if (!normalRange) return true;
        
        return value >= normalRange.min && value <= normalRange.max;
    }

    /**
     * Υπολογισμός AI Score
     */
    calculateAIScore(measurementData) {
        let score = 50; // Βασικό score

        // Confidence bonus
        if (measurementData.aiConfidence) {
            score += (measurementData.aiConfidence - 50) * 0.5;
        }

        // Method bonus
        if (measurementData.method === 'ai_analysis') {
            score += 20;
        } else if (measurementData.method === 'xray_analysis') {
            score += 15;
        }

        // Φυσιολογική τιμή bonus
        if (measurementData.type && this.isValueNormal(measurementData.type, measurementData.value)) {
            score += 10;
        }

        return Math.min(Math.max(score, 0), 100);
    }

    /**
     * Υπολογισμός αξιοπιστίας
     */
    calculateReliability(measurementData) {
        let reliability = 'medium';

        if (measurementData.method === 'ai_analysis' && measurementData.aiConfidence >= 90) {
            reliability = 'high';
        } else if (measurementData.method === 'manual') {
            reliability = 'high';
        } else if (measurementData.aiConfidence && measurementData.aiConfidence < 70) {
            reliability = 'low';
        }

        return reliability;
    }

    /**
     * Υπολογισμός εκτίμησης κινδύνου
     */
    calculateRiskAssessment(summary) {
        let riskScore = 0;

        // Μη φυσιολογικές μετρήσεις
        const abnormalPercentage = (summary.abnormalMeasurements / summary.totalMeasurements) * 100;
        if (abnormalPercentage > 30) riskScore += 3;
        else if (abnormalPercentage > 15) riskScore += 2;
        else if (abnormalPercentage > 5) riskScore += 1;

        // Χαμηλή confidence
        const lowConfidencePercentage = ((summary.totalMeasurements - summary.highConfidenceMeasurements) / summary.totalMeasurements) * 100;
        if (lowConfidencePercentage > 50) riskScore += 2;
        else if (lowConfidencePercentage > 25) riskScore += 1;

        // Κατηγοριοποίηση κινδύνου
        if (riskScore >= 4) return 'high';
        else if (riskScore >= 2) return 'medium';
        else return 'low';
    }

    /**
     * Υπολογισμός score ποιότητας
     */
    calculateQualityScore(summary) {
        let score = 100;

        // Αφαίρεση για μη φυσιολογικές μετρήσεις
        const abnormalPercentage = (summary.abnormalMeasurements / summary.totalMeasurements) * 100;
        score -= abnormalPercentage * 0.5;

        // Αφαίρεση για χαμηλή confidence
        if (summary.averageConfidence < 80) {
            score -= (80 - summary.averageConfidence) * 0.3;
        }

        // Bonus για πολλές μετρήσεις
        if (summary.totalMeasurements > 20) score += 5;
        else if (summary.totalMeasurements > 10) score += 3;

        return Math.max(Math.min(score, 100), 0);
    }

    /**
     * Δημιουργία συστάσεων
     */
    generateRecommendations(summary, measurements) {
        const recommendations = [];

        // Συστάσεις βάσει μη φυσιολογικών μετρήσεων
        if (summary.abnormalMeasurements > 0) {
            recommendations.push({
                type: 'clinical',
                priority: 'high',
                message: `Βρέθηκαν ${summary.abnormalMeasurements} μη φυσιολογικές μετρήσεις που χρειάζονται περαιτέρω εξέταση`
            });
        }

        // Συστάσεις βάσει χαμηλής confidence
        const lowConfidenceCount = summary.totalMeasurements - summary.highConfidenceMeasurements;
        if (lowConfidenceCount > summary.totalMeasurements * 0.3) {
            recommendations.push({
                type: 'technical',
                priority: 'medium',
                message: `${lowConfidenceCount} μετρήσεις έχουν χαμηλή αξιοπιστία - συνιστάται επανάληψη`
            });
        }

        // Συστάσεις βάσει κατηγοριών
        Object.entries(summary.categorySummary).forEach(([category, count]) => {
            if (category === 'periodontal' && count > 5) {
                recommendations.push({
                    type: 'clinical',
                    priority: 'medium',
                    message: 'Πολλές περιοδοντικές μετρήσεις - συνιστάται περιοδοντική εκτίμηση'
                });
            }
        });

        return recommendations;
    }

    /**
     * Μορφοποίηση τύπου μέτρησης
     */
    formatMeasurementType(measurementType) {
        return this.measurementTypes[measurementType]?.name || measurementType;
    }

    /**
     * Εξαγωγή δεδομένων ασθενή
     */
    exportPatientData() {
        if (!this.patientData) {
            throw new Error('Δεν υπάρχουν δεδομένα ασθενή');
        }

        return {
            patient: this.patientData,
            measurements: this.getAllMeasurements(),
            summary: this.generateMeasurementSummary(),
            report: this.generateMeasurementReport(),
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
    }

    /**
     * Εισαγωγή δεδομένων ασθενή
     */
    importPatientData(data) {
        if (!data || !data.patient) {
            throw new Error('Μη έγκυρα δεδομένα εισαγωγής');
        }

        this.setPatientData(data.patient);
        
        if (data.measurements) {
            this.patientData.measurements = data.measurements;
        }

        console.log('✅ Δεδομένα ασθενή εισήχθησαν επιτυχώς');
        return true;
    }

    /**
     * Προσθήκη στο ιστορικό
     */
    addToHistory(action, toothNumber, data) {
        this.measurementHistory.push({
            id: this.generateHistoryId(),
            action: action,
            toothNumber: toothNumber,
            data: data,
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser()
        });

        // Διατήρηση μόνο των τελευταίων 100 εγγραφών
        if (this.measurementHistory.length > 100) {
            this.measurementHistory = this.measurementHistory.slice(-100);
        }
    }

    /**
     * Λήψη ιστορικού
     */
    getHistory(limit = 50) {
        return this.measurementHistory.slice(-limit).reverse();
    }

    /**
     * Dispatch measurement event
     */
    dispatchMeasurementEvent(eventType, detail) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(eventType, { detail }));
        }
    }

    /**
     * Event handlers
     */
    onMeasurementAdded(detail) {
        console.log('📏 Νέα μέτρηση προστέθηκε:', detail);
    }

    onAIAnalysisComplete(detail) {
        console.log('🤖 AI ανάλυση ολοκληρώθηκε:', detail);
        
        if (detail.measurements && detail.toothNumber) {
            this.addAIMeasurements(detail.toothNumber, detail.measurements, detail.xrayId);
        }
    }

    /**
     * Utility functions
     */
    generateMeasurementId() {
        return `meas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateHistoryId() {
        return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCurrentUser() {
        // Έλεγχος για global user object
        if (typeof window !== 'undefined' && window.currentUser) {
            return window.currentUser.name || window.currentUser.id || 'Unknown User';
        }
        
        // Fallback
        return 'System User';
    }

    /**
     * Λήψη στατιστικών
     */
    getStatistics() {
        const summary = this.generateMeasurementSummary();
        
        return {
            totalMeasurements: summary.totalMeasurements,
            teethWithMeasurements: summary.teethWithMeasurements,
            averageConfidence: summary.averageConfidence,
            abnormalMeasurements: summary.abnormalMeasurements,
            measurementTypes: Object.keys(this.measurementTypes).length,
            historyEntries: this.measurementHistory.length,
            lastUpdate: new Date().toISOString()
        };
    }
}

// Export για χρήση
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedMeasurementsSystem;
} else {
    window.AdvancedMeasurementsSystem = AdvancedMeasurementsSystem;
}