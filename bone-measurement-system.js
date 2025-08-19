/**
 * 📏 Σύστημα Μέτρησης Οστού & Βαθμονομήσεων
 * Bone Measurement & Calibration System
 * 
 * Χαρακτηριστικά:
 * - Calibration με px/mm ratio από scale bar ή γνωστή απόσταση
 * - Μετρήσεις νωδών σημείων (edentulous bone)
 * - Μετρήσεις περι-εμφυτευματικού οστού (peri-implant bone)
 * - Measurement lines κάθετα στην ακρολοφία
 * - Αποθήκευση και διαχείριση μετρήσεων
 */

class BoneMeasurementSystem {
    constructor() {
        this.calibrationData = {
            pixelsPerMm: null,
            calibrationMethod: null, // 'scale_bar' | 'known_distance'
            calibrationPoints: [],
            imageId: null,
            calibratedBy: null,
            calibrationDate: null
        };
        
        this.measurements = {
            edentulous_bone: [],
            peri_implant_bone: []
        };
        
        this.isCalibrationMode = false;
        this.isMeasurementMode = false;
        this.currentMeasurementType = null;
        this.measurementLines = [];
        
        this.canvas = null;
        this.ctx = null;
        this.imageElement = null;
        
        this.initializeEventListeners();
    }

    /**
     * Αρχικοποίηση του συστήματος με εικόνα
     */
    initialize(imageElement, canvasElement) {
        this.imageElement = imageElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        
        // Ρύθμιση canvas dimensions
        this.canvas.width = this.imageElement.naturalWidth;
        this.canvas.height = this.imageElement.naturalHeight;
        
        // Σχεδίαση εικόνας στο canvas
        this.ctx.drawImage(this.imageElement, 0, 0);
        
        // Dispatch custom event to notify that stage is ready
        document.dispatchEvent(new Event('xray:stage-ready'));
        
        console.log('✅ Bone Measurement System initialized');
    }

    /**
     * Ενεργοποίηση λειτουργίας calibration
     */
    startCalibration(method = 'known_distance') {
        this.isCalibrationMode = true;
        this.isMeasurementMode = false;
        this.calibrationData.calibrationMethod = method;
        this.calibrationData.calibrationPoints = [];
        
        this.showCalibrationInstructions(method);
        console.log(`🎯 Calibration mode started: ${method}`);
    }

    /**
     * Εμφάνιση οδηγιών calibration
     */
    showCalibrationInstructions(method) {
        const instructions = {
            'scale_bar': 'Κάντε κλικ στα δύο άκρα της κλίμακας (scale bar) στην εικόνα',
            'known_distance': 'Κάντε κλικ σε δύο σημεία γνωστής απόστασης (π.χ. μεταλλική σφαίρα)'
        };
        
        this.showNotification(instructions[method], 'info');
    }

    /**
     * Διαχείριση κλικ για calibration
     */
    handleCalibrationClick(x, y) {
        if (!this.isCalibrationMode) return;
        
        this.calibrationData.calibrationPoints.push({ x, y });
        
        // Σχεδίαση σημείου calibration
        this.drawCalibrationPoint(x, y);
        
        if (this.calibrationData.calibrationPoints.length === 2) {
            this.completeCalibration();
        }
    }

    /**
     * Ολοκλήρωση calibration
     */
    completeCalibration() {
        const points = this.calibrationData.calibrationPoints;
        const pixelDistance = this.calculateDistance(points[0], points[1]);
        
        // Σχεδίαση γραμμής calibration
        this.drawCalibrationLine(points[0], points[1]);
        
        // Ζήτηση πραγματικής απόστασης από χρήστη
        this.promptForRealDistance(pixelDistance);
    }

    /**
     * Ζήτηση πραγματικής απόστασης
     */
    promptForRealDistance(pixelDistance) {
        const modal = this.createCalibrationModal(pixelDistance);
        document.body.appendChild(modal);
    }

    /**
     * Δημιουργία modal για calibration
     */
    createCalibrationModal(pixelDistance) {
        const modal = document.createElement('div');
        modal.className = 'calibration-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Βαθμονόμηση Εικόνας</h3>
                </div>
                <div class="modal-body">
                    <p>Απόσταση σε pixels: <strong>${pixelDistance.toFixed(2)} px</strong></p>
                    <div class="input-group">
                        <label for="realDistance">Πραγματική απόσταση (mm):</label>
                        <input type="number" id="realDistance" step="0.1" placeholder="10.0" autofocus>
                    </div>
                    <div class="calibration-info">
                        <p><small>Εισάγετε την πραγματική απόσταση μεταξύ των δύο σημείων που επιλέξατε.</small></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="boneMeasurement.cancelCalibration()" class="btn-cancel">Ακύρωση</button>
                    <button onclick="boneMeasurement.saveCalibration(${pixelDistance})" class="btn-save">Αποθήκευση</button>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * Αποθήκευση calibration
     */
    saveCalibration(pixelDistance) {
        const realDistanceInput = document.getElementById('realDistance');
        const realDistance = parseFloat(realDistanceInput.value);
        
        if (!realDistance || realDistance <= 0) {
            this.showNotification('Παρακαλώ εισάγετε έγκυρη απόσταση', 'error');
            return;
        }
        
        // Υπολογισμός px/mm ratio
        this.calibrationData.pixelsPerMm = pixelDistance / realDistance;
        this.calibrationData.calibratedBy = this.getCurrentUser();
        this.calibrationData.calibrationDate = new Date().toISOString();
        this.calibrationData.imageId = this.getCurrentImageId();
        
        // Κλείσιμο modal
        document.querySelector('.calibration-modal').remove();
        
        // Τερματισμός calibration mode
        this.isCalibrationMode = false;
        
        this.showNotification(
            `Βαθμονόμηση ολοκληρώθηκε: ${this.calibrationData.pixelsPerMm.toFixed(3)} px/mm`, 
            'success'
        );
        
        console.log('✅ Calibration completed:', this.calibrationData);
    }

    /**
     * Ακύρωση calibration
     */
    cancelCalibration() {
        this.isCalibrationMode = false;
        this.calibrationData.calibrationPoints = [];
        
        // Αφαίρεση modal
        const modal = document.querySelector('.calibration-modal');
        if (modal) modal.remove();
        
        // Καθαρισμός canvas
        this.redrawCanvas();
        
        this.showNotification('Βαθμονόμηση ακυρώθηκε', 'info');
    }

    /**
     * Έναρξη μέτρησης νωδών σημείων
     */
    startEdentulousBonemeasurement() {
        if (!this.isCalibrated()) {
            this.showNotification('Παρακαλώ πραγματοποιήστε πρώτα βαθμονόμηση', 'warning');
            return;
        }
        
        this.isMeasurementMode = true;
        this.currentMeasurementType = 'edentulous';
        this.showNotification('Κάντε κλικ για να σχεδιάσετε γραμμές μέτρησης κάθετα στην ακρολοφία', 'info');
    }

    /**
     * Έναρξη μέτρησης περι-εμφυτευματικού οστού
     */
    startPeriImplantMeasurement() {
        if (!this.isCalibrated()) {
            this.showNotification('Παρακαλώ πραγματοποιήστε πρώτα βαθμονόμηση', 'warning');
            return;
        }
        
        this.isMeasurementMode = true;
        this.currentMeasurementType = 'peri_implant';
        this.showNotification('Κάντε κλικ για μέτρηση από αυχένα εμφυτεύματος προς κογχοειδές σημείο', 'info');
    }

    /**
     * Διαχείριση κλικ για μετρήσεις
     */
    handleMeasurementClick(x, y) {
        if (!this.isMeasurementMode) return;
        
        if (this.currentMeasurementType === 'edentulous') {
            this.handleEdentulousClick(x, y);
        } else if (this.currentMeasurementType === 'peri_implant') {
            this.handlePeriImplantClick(x, y);
        }
    }

    /**
     * Διαχείριση κλικ για νωδές μετρήσεις
     */
    handleEdentulousClick(x, y) {
        // Για νωδές μετρήσεις, χρειαζόμαστε δύο σημεία για κάθε γραμμή
        if (!this.currentMeasurementLine) {
            this.currentMeasurementLine = { start: { x, y }, end: null };
            this.drawMeasurementPoint(x, y, 'start');
        } else {
            this.currentMeasurementLine.end = { x, y };
            this.drawMeasurementPoint(x, y, 'end');
            this.completeMeasurementLine();
        }
    }

    /**
     * Διαχείριση κλικ για περι-εμφυτευματικές μετρήσεις
     */
    handlePeriImplantClick(x, y) {
        // Παρόμοια λογική με edentulous αλλά με διαφορετική κατηγοριοποίηση
        if (!this.currentMeasurementLine) {
            this.currentMeasurementLine = { start: { x, y }, end: null };
            this.drawMeasurementPoint(x, y, 'start');
        } else {
            this.currentMeasurementLine.end = { x, y };
            this.drawMeasurementPoint(x, y, 'end');
            this.completePeriImplantMeasurement();
        }
    }

    /**
     * Ολοκλήρωση γραμμής μέτρησης για νωδά σημεία
     */
    completeMeasurementLine() {
        const line = this.currentMeasurementLine;
        const pixelDistance = this.calculateDistance(line.start, line.end);
        const mmDistance = this.convertPixelsToMm(pixelDistance);
        
        // Σχεδίαση γραμμής μέτρησης
        this.drawMeasurementLine(line.start, line.end, mmDistance);
        
        // Ζήτηση site information
        this.promptForSiteInfo(mmDistance, 'edentulous');
        
        this.currentMeasurementLine = null;
    }

    /**
     * Ολοκλήρωση μέτρησης περι-εμφυτευματικού οστού
     */
    completePeriImplantMeasurement() {
        const line = this.currentMeasurementLine;
        const pixelDistance = this.calculateDistance(line.start, line.end);
        const mmDistance = this.convertPixelsToMm(pixelDistance);
        
        // Σχεδίαση γραμμής μέτρησης
        this.drawMeasurementLine(line.start, line.end, mmDistance, 'peri-implant');
        
        // Ζήτηση implant information
        this.promptForImplantInfo(mmDistance);
        
        this.currentMeasurementLine = null;
    }

    /**
     * Ζήτηση πληροφοριών site για νωδές μετρήσεις
     */
    promptForSiteInfo(mmDistance, type) {
        const modal = this.createSiteInfoModal(mmDistance, type);
        document.body.appendChild(modal);
    }

    /**
     * Ζήτηση πληροφοριών εμφυτεύματος
     */
    promptForImplantInfo(mmDistance) {
        const modal = this.createImplantInfoModal(mmDistance);
        document.body.appendChild(modal);
    }

    /**
     * Δημιουργία modal για site info
     */
    createSiteInfoModal(mmDistance, type) {
        const modal = document.createElement('div');
        modal.className = 'measurement-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Μέτρηση Νωδού Οστού</h3>
                </div>
                <div class="modal-body">
                    <p>Μέτρηση: <strong>${mmDistance.toFixed(1)} mm</strong></p>
                    <div class="input-group">
                        <label for="siteLocation">Θέση (π.χ. "23-24"):</label>
                        <input type="text" id="siteLocation" placeholder="23-24" autofocus>
                    </div>
                    <div class="input-group">
                        <label for="siteNotes">Σημειώσεις:</label>
                        <textarea id="siteNotes" placeholder="Πρόσθετες παρατηρήσεις..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="boneMeasurement.cancelMeasurement()" class="btn-cancel">Ακύρωση</button>
                    <button onclick="boneMeasurement.saveEdentulouseMeasurement(${mmDistance})" class="btn-save">Αποθήκευση</button>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * Δημιουργία modal για implant info
     */
    createImplantInfoModal(mmDistance) {
        const modal = document.createElement('div');
        modal.className = 'measurement-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Μέτρηση Περι-εμφυτευματικού Οστού</h3>
                </div>
                <div class="modal-body">
                    <p>Μέτρηση: <strong>${mmDistance.toFixed(1)} mm</strong></p>
                    <div class="input-group">
                        <label for="toothNumber">Δόντι:</label>
                        <input type="text" id="toothNumber" placeholder="24" autofocus>
                    </div>
                    <div class="input-group">
                        <label for="measurementSide">Πλευρά:</label>
                        <select id="measurementSide">
                            <option value="mesial">Μεσιακή</option>
                            <option value="distal">Άπω</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="implantNotes">Σημειώσεις:</label>
                        <textarea id="implantNotes" placeholder="Πρόσθετες παρατηρήσεις..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="boneMeasurement.cancelMeasurement()" class="btn-cancel">Ακύρωση</button>
                    <button onclick="boneMeasurement.savePeriImplantMeasurement(${mmDistance})" class="btn-save">Αποθήκευση</button>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * Αποθήκευση μέτρησης νωδού οστού
     */
    saveEdentulouseMeasurement(mmDistance) {
        const siteLocation = document.getElementById('siteLocation').value;
        const siteNotes = document.getElementById('siteNotes').value;
        
        if (!siteLocation) {
            this.showNotification('Παρακαλώ εισάγετε τη θέση', 'error');
            return;
        }
        
        const measurement = {
            id: this.generateMeasurementId(),
            site: siteLocation,
            mm: parseFloat(mmDistance.toFixed(1)),
            notes: siteNotes,
            date: new Date().toISOString(),
            measuredBy: this.getCurrentUser(),
            imageId: this.getCurrentImageId(),
            calibrationData: { ...this.calibrationData }
        };
        
        this.measurements.edentulous_bone.push(measurement);
        
        // Κλείσιμο modal
        document.querySelector('.measurement-modal').remove();
        
        this.showNotification(`Μέτρηση αποθηκεύτηκε: ${siteLocation} - ${mmDistance.toFixed(1)}mm`, 'success');
        
        console.log('✅ Edentulous measurement saved:', measurement);
    }

    /**
     * Αποθήκευση μέτρησης περι-εμφυτευματικού οστού
     */
    savePeriImplantMeasurement(mmDistance) {
        const toothNumber = document.getElementById('toothNumber').value;
        const measurementSide = document.getElementById('measurementSide').value;
        const implantNotes = document.getElementById('implantNotes').value;
        
        if (!toothNumber) {
            this.showNotification('Παρακαλώ εισάγετε τον αριθμό δοντιού', 'error');
            return;
        }
        
        // Εύρεση υπάρχουσας εγγραφής ή δημιουργία νέας
        let existingMeasurement = this.measurements.peri_implant_bone.find(m => m.tooth === toothNumber);
        
        if (!existingMeasurement) {
            existingMeasurement = {
                id: this.generateMeasurementId(),
                tooth: toothNumber,
                mesial: null,
                distal: null,
                notes: implantNotes,
                date: new Date().toISOString(),
                measuredBy: this.getCurrentUser(),
                imageId: this.getCurrentImageId(),
                calibrationData: { ...this.calibrationData }
            };
            this.measurements.peri_implant_bone.push(existingMeasurement);
        }
        
        // Ενημέρωση μέτρησης
        existingMeasurement[measurementSide] = parseFloat(mmDistance.toFixed(1));
        if (implantNotes) {
            existingMeasurement.notes = implantNotes;
        }
        
        // Κλείσιμο modal
        document.querySelector('.measurement-modal').remove();
        
        this.showNotification(
            `Μέτρηση αποθηκεύτηκε: Δόντι ${toothNumber} (${measurementSide}) - ${mmDistance.toFixed(1)}mm`, 
            'success'
        );
        
        console.log('✅ Peri-implant measurement saved:', existingMeasurement);
    }

    /**
     * Ακύρωση μέτρησης
     */
    cancelMeasurement() {
        this.currentMeasurementLine = null;
        
        // Αφαίρεση modal
        const modal = document.querySelector('.measurement-modal');
        if (modal) modal.remove();
        
        this.showNotification('Μέτρηση ακυρώθηκε', 'info');
    }

    /**
     * Τερματισμός λειτουργίας μέτρησης
     */
    stopMeasurement() {
        this.isMeasurementMode = false;
        this.currentMeasurementType = null;
        this.currentMeasurementLine = null;
        
        this.showNotification('Λειτουργία μέτρησης τερματίστηκε', 'info');
    }

    /**
     * Έλεγχος αν έχει γίνει calibration
     */
    isCalibrated() {
        return this.calibrationData.pixelsPerMm !== null;
    }

    /**
     * Μετατροπή pixels σε mm
     */
    convertPixelsToMm(pixels) {
        if (!this.isCalibrated()) {
            throw new Error('Δεν έχει γίνει calibration');
        }
        return pixels / this.calibrationData.pixelsPerMm;
    }

    /**
     * Μετατροπή mm σε pixels
     */
    convertMmToPixels(mm) {
        if (!this.isCalibrated()) {
            throw new Error('Δεν έχει γίνει calibration');
        }
        return mm * this.calibrationData.pixelsPerMm;
    }

    /**
     * Υπολογισμός απόστασης μεταξύ δύο σημείων
     */
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Σχεδίαση σημείου calibration
     */
    drawCalibrationPoint(x, y) {
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Σχεδίαση γραμμής calibration
     */
    drawCalibrationLine(point1, point2) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(point1.x, point1.y);
        this.ctx.lineTo(point2.x, point2.y);
        this.ctx.stroke();
    }

    /**
     * Σχεδίαση σημείου μέτρησης
     */
    drawMeasurementPoint(x, y, type) {
        this.ctx.fillStyle = type === 'start' ? '#00ff00' : '#0000ff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Σχεδίαση γραμμής μέτρησης
     */
    drawMeasurementLine(point1, point2, mmDistance, type = 'edentulous') {
        const color = type === 'peri-implant' ? '#ff6600' : '#00aa00';
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(point1.x, point1.y);
        this.ctx.lineTo(point2.x, point2.y);
        this.ctx.stroke();
        
        // Προσθήκη label με την τιμή
        const midX = (point1.x + point2.x) / 2;
        const midY = (point1.y + point2.y) / 2;
        
        this.ctx.fillStyle = color;
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`${mmDistance.toFixed(1)}mm`, midX + 5, midY - 5);
    }

    /**
     * Επανασχεδίαση canvas
     */
    redrawCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.imageElement, 0, 0);
        
        // Επανασχεδίαση όλων των μετρήσεων
        this.redrawAllMeasurements();
    }

    /**
     * Επανασχεδίαση όλων των μετρήσεων
     */
    redrawAllMeasurements() {
        // Επανασχεδίαση calibration line αν υπάρχει
        if (this.calibrationData.calibrationPoints.length === 2) {
            this.drawCalibrationLine(
                this.calibrationData.calibrationPoints[0],
                this.calibrationData.calibrationPoints[1]
            );
        }
        
        // Επανασχεδίαση measurement lines
        this.measurementLines.forEach(line => {
            this.drawMeasurementLine(line.start, line.end, line.mmDistance, line.type);
        });
    }

    /**
     * Εξαγωγή δεδομένων μετρήσεων
     */
    exportMeasurements() {
        const exportData = {
            calibration: this.calibrationData,
            measurements: this.measurements,
            exportDate: new Date().toISOString(),
            exportedBy: this.getCurrentUser()
        };
        
        return exportData;
    }

    /**
     * Εισαγωγή δεδομένων μετρήσεων
     */
    importMeasurements(data) {
        if (data.calibration) {
            this.calibrationData = data.calibration;
        }
        
        if (data.measurements) {
            this.measurements = data.measurements;
        }
        
        this.redrawCanvas();
        
        console.log('✅ Measurements imported successfully');
    }

    /**
     * Καθαρισμός όλων των μετρήσεων
     */
    clearAllMeasurements() {
        this.measurements = {
            edentulous_bone: [],
            peri_implant_bone: []
        };
        
        this.measurementLines = [];
        this.redrawCanvas();
        
        this.showNotification('Όλες οι μετρήσεις διαγράφηκαν', 'info');
    }

    /**
     * Καθαρισμός calibration
     */
    clearCalibration() {
        this.calibrationData = {
            pixelsPerMm: null,
            calibrationMethod: null,
            calibrationPoints: [],
            imageId: null,
            calibratedBy: null,
            calibrationDate: null
        };
        
        this.redrawCanvas();
        
        this.showNotification('Βαθμονόμηση διαγράφηκε', 'info');
    }

    /**
     * Δημιουργία αναφοράς μετρήσεων
     */
    generateMeasurementReport() {
        const report = {
            patient: this.getCurrentPatient(),
            image: this.getCurrentImageId(),
            calibration: this.calibrationData,
            edentulous_measurements: this.measurements.edentulous_bone,
            peri_implant_measurements: this.measurements.peri_implant_bone,
            summary: {
                total_edentulous: this.measurements.edentulous_bone.length,
                total_peri_implant: this.measurements.peri_implant_bone.length,
                average_edentulous: this.calculateAverageEdentulous(),
                calibration_accuracy: this.calibrationData.pixelsPerMm ? 'Calibrated' : 'Not Calibrated'
            },
            generated_date: new Date().toISOString(),
            generated_by: this.getCurrentUser()
        };
        
        return report;
    }

    /**
     * Υπολογισμός μέσου όρου νωδών μετρήσεων
     */
    calculateAverageEdentulous() {
        if (this.measurements.edentulous_bone.length === 0) return 0;
        
        const total = this.measurements.edentulous_bone.reduce((sum, m) => sum + m.mm, 0);
        return (total / this.measurements.edentulous_bone.length).toFixed(1);
    }

    /**
     * Αρχικοποίηση event listeners
     */
    initializeEventListeners() {
        // Canvas click events
        if (typeof window !== 'undefined') {
            window.addEventListener('click', (event) => {
                if (event.target === this.canvas) {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;
                    
                    if (this.isCalibrationMode) {
                        this.handleCalibrationClick(x, y);
                    } else if (this.isMeasurementMode) {
                        this.handleMeasurementClick(x, y);
                    }
                }
            });
        }
    }

    /**
     * Εμφάνιση notification
     */
    showNotification(message, type = 'info') {
        // Δημιουργία notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Αυτόματη αφαίρεση μετά από 3 δευτερόλεπτα
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }

    /**
     * Utility functions
     */
    generateMeasurementId() {
        return 'meas_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentUser() {
        // Επιστροφή τρέχοντος χρήστη - θα συνδεθεί με το σύστημα authentication
        return 'Dr. Current User';
    }

    getCurrentImageId() {
        // Επιστροφή ID τρέχουσας εικόνας
        return this.imageElement ? this.imageElement.src.split('/').pop() : 'unknown_image';
    }

    getCurrentPatient() {
        // Επιστροφή τρέχοντος ασθενή - θα συνδεθεί με το patient management system
        return window.appState ? window.appState.getCurrentPatient() : null;
    }
}

// CSS Styles για το σύστημα
const boneMeasurementStyles = `
<style>
.calibration-modal, .measurement-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
    background: #2c3e50;
    color: white;
    padding: 15px 20px;
    border-radius: 8px 8px 0 0;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
}

.modal-body {
    padding: 20px;
}

.input-group {
    margin-bottom: 15px;
}

.input-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #2c3e50;
}

.input-group input,
.input-group select,
.input-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.input-group textarea {
    resize: vertical;
    min-height: 60px;
}

.calibration-info {
    background: #f8f9fa;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
}

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn-cancel, .btn-save {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
}

.btn-cancel {
    background: #6c757d;
    color: white;
}

.btn-cancel:hover {
    background: #5a6268;
}

.btn-save {
    background: #28a745;
    color: white;
}

.btn-save:hover {
    background: #218838;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    z-index: 1001;
    animation: slideIn 0.3s ease-out;
}

.notification-info {
    background: #17a2b8;
}

.notification-success {
    background: #28a745;
}

.notification-warning {
    background: #ffc107;
    color: #212529;
}

.notification-error {
    background: #dc3545;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.bone-measurement-controls {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.control-group {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.control-btn {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
}

.control-btn:hover {
    background: #e9ecef;
}

.control-btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
}

.calibration-info-display {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
}

.measurement-summary {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin-top: 20px;
}

.measurement-list {
    max-height: 200px;
    overflow-y: auto;
}

.measurement-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.measurement-item:last-child {
    border-bottom: none;
}

.measurement-value {
    font-weight: bold;
    color: #007bff;
}
</style>
`;

// Προσθήκη styles στο document
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', boneMeasurementStyles);
}

// Export για χρήση σε άλλα modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoneMeasurementSystem;
} else if (typeof window !== 'undefined') {
    window.BoneMeasurementSystem = BoneMeasurementSystem;
}