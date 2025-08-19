// ai-training-ui.js - UI Components για AI Training με πραγματικό progress tracking

// AI Training UI Manager
class AITrainingUI {
    constructor() {
        this.progressBar = null;
        this.statusDisplay = null;
        this.logContainer = null;
        this.metricsDisplay = null;
        this.isInitialized = false;
        this.currentSession = null;
        this.logBuffer = [];
        this.maxLogs = 500;
    }

    initialize() {
        this.createTrainingInterface();
        this.setupEventListeners();
        this.setupCallbacks();
        this.isInitialized = true;
        console.log('AI Training UI initialized');
    }

    createTrainingInterface() {
        // Find or create training container
        let container = document.getElementById('ai-training-interface');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ai-training-interface';
            container.className = 'ai-training-interface';
            
            // Insert into AI training tab
            const aiTab = document.getElementById('ai-training');
            if (aiTab) {
                aiTab.appendChild(container);
            }
        }

        container.innerHTML = `
            <div class="ai-training-dashboard">
                <!-- Training Controls -->
                <div class="training-controls">
                    <h3>🤖 AI Training Controls</h3>
                    <div class="control-buttons">
                        <button id="start-training-btn" class="btn btn-primary">
                            <i class="fas fa-play"></i> Εκκίνηση Εκπαίδευσης
                        </button>
                        <button id="stop-training-btn" class="btn btn-danger" disabled>
                            <i class="fas fa-stop"></i> Διακοπή
                        </button>
                        <button id="reset-training-btn" class="btn btn-secondary">
                            <i class="fas fa-refresh"></i> Επαναφορά
                        </button>
                    </div>
                    
                    <div class="model-selection">
                        <label for="model-type">Μοντέλο:</label>
                        <select id="model-type" class="form-control">
                            <option value="dental_diagnosis">Dental Diagnosis</option>
                            <option value="xray_analysis">X-ray Analysis</option>
                            <option value="symptom_classifier">Symptom Classifier</option>
                        </select>
                    </div>
                </div>

                <!-- Training Status -->
                <div class="training-status">
                    <h3>📊 Training Status</h3>
                    <div class="status-grid">
                        <div class="status-item">
                            <label>Status:</label>
                            <span id="training-status" class="status-value">Ready</span>
                        </div>
                        <div class="status-item">
                            <label>Progress:</label>
                            <span id="training-progress-text" class="status-value">0%</span>
                        </div>
                        <div class="status-item">
                            <label>Epoch:</label>
                            <span id="current-epoch" class="status-value">0/0</span>
                        </div>
                        <div class="status-item">
                            <label>ETA:</label>
                            <span id="training-eta" class="status-value">--</span>
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="progress-container">
                        <div class="progress-bar-wrapper">
                            <div id="training-progress-bar" class="progress-bar">
                                <div class="progress-fill" style="width: 0%"></div>
                                <span class="progress-text">0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Real-time Metrics -->
                <div class="training-metrics">
                    <h3>📈 Real-time Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <label>Loss:</label>
                            <span id="current-loss" class="metric-value">--</span>
                        </div>
                        <div class="metric-item">
                            <label>Accuracy:</label>
                            <span id="current-accuracy" class="metric-value">--</span>
                        </div>
                        <div class="metric-item">
                            <label>Val Loss:</label>
                            <span id="current-val-loss" class="metric-value">--</span>
                        </div>
                        <div class="metric-item">
                            <label>Val Accuracy:</label>
                            <span id="current-val-accuracy" class="metric-value">--</span>
                        </div>
                    </div>
                    
                    <!-- Metrics Chart Placeholder -->
                    <div class="metrics-chart">
                        <canvas id="metrics-chart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Training Logs -->
                <div class="training-logs">
                    <h3>📝 Training Logs</h3>
                    <div class="log-controls">
                        <button id="clear-logs-btn" class="btn btn-sm btn-secondary">Clear Logs</button>
                        <button id="export-logs-btn" class="btn btn-sm btn-info">Export Logs</button>
                        <label>
                            <input type="checkbox" id="auto-scroll-logs" checked> Auto-scroll
                        </label>
                    </div>
                    <div id="training-log-container" class="log-container">
                        <div class="log-entry info">
                            <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
                            <span class="log-level">INFO</span>
                            <span class="log-message">AI Training UI ready</span>
                        </div>
                    </div>
                </div>

                <!-- Model Information -->
                <div class="model-info">
                    <h3>🔧 Model Information</h3>
                    <div id="model-info-content">
                        <!-- Will be populated dynamically -->
                    </div>
                </div>
            </div>
        `;

        this.progressBar = container.querySelector('#training-progress-bar .progress-fill');
        this.statusDisplay = container.querySelector('#training-status');
        this.logContainer = container.querySelector('#training-log-container');
        this.metricsDisplay = {
            loss: container.querySelector('#current-loss'),
            accuracy: container.querySelector('#current-accuracy'),
            valLoss: container.querySelector('#current-val-loss'),
            valAccuracy: container.querySelector('#current-val-accuracy')
        };
    }

    setupEventListeners() {
        // Training control buttons
        document.getElementById('start-training-btn')?.addEventListener('click', () => this.startTraining());
        document.getElementById('stop-training-btn')?.addEventListener('click', () => this.stopTraining());
        document.getElementById('reset-training-btn')?.addEventListener('click', () => this.resetTraining());
        
        // Log controls
        document.getElementById('clear-logs-btn')?.addEventListener('click', () => this.clearLogs());
        document.getElementById('export-logs-btn')?.addEventListener('click', () => this.exportLogs());
        
        // Model selection
        document.getElementById('model-type')?.addEventListener('change', (e) => this.updateModelInfo(e.target.value));
    }

    setupCallbacks() {
        // Set up global callbacks for AI backend
        window.aiProgressCallback = (data) => this.updateProgress(data);
        window.aiLogCallback = (logEntry) => this.addLogEntry(logEntry);
    }

    async startTraining() {
        try {
            const modelType = document.getElementById('model-type')?.value || 'dental_diagnosis';
            const trainingData = this.getTrainingData();

            if (trainingData.length < 5) {
                this.showNotification('Χρειάζονται τουλάχιστον 5 δεδομένα εκπαίδευσης', 'warning');
                return;
            }

            // Initialize AI backend if not already done
            if (!window.aiBackend.isConnected) {
                this.addLogEntry({
                    level: 'info',
                    message: 'Initializing AI backend...',
                    timestamp: new Date().toISOString()
                });
                
                const initialized = await window.aiBackend.initialize();
                if (!initialized) {
                    throw new Error('Failed to initialize AI backend');
                }
            }

            // Update UI state
            this.setTrainingState(true);
            this.addLogEntry({
                level: 'info',
                message: `Starting training for model: ${modelType}`,
                timestamp: new Date().toISOString()
            });

            // Start training
            this.currentSession = await window.aiBackend.startTraining(modelType, trainingData);
            
        } catch (error) {
            this.addLogEntry({
                level: 'error',
                message: `Training failed: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            this.setTrainingState(false);
            this.showNotification(`Training failed: ${error.message}`, 'error');
        }
    }

    stopTraining() {
        if (window.aiBackend.stopTraining()) {
            this.addLogEntry({
                level: 'warning',
                message: 'Training stopped by user',
                timestamp: new Date().toISOString()
            });
            this.setTrainingState(false);
        }
    }

    resetTraining() {
        this.stopTraining();
        this.updateProgress({
            progress: 0,
            epoch: 0,
            totalEpochs: 0,
            status: 'ready'
        });
        this.clearMetrics();
        this.addLogEntry({
            level: 'info',
            message: 'Training reset',
            timestamp: new Date().toISOString()
        });
    }

    updateProgress(data) {
        if (!this.isInitialized) return;

        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${data.progress}%`;
            const progressText = this.progressBar.parentElement.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = `${data.progress}%`;
            }
        }

        // Update status displays
        document.getElementById('training-status').textContent = this.formatStatus(data.status);
        document.getElementById('training-progress-text').textContent = `${data.progress}%`;
        document.getElementById('current-epoch').textContent = `${data.epoch}/${data.totalEpochs}`;
        
        // Calculate and display ETA
        if (data.epoch > 0 && data.progress > 0) {
            const eta = this.calculateETA(data.epoch, data.totalEpochs, data.progress);
            document.getElementById('training-eta').textContent = eta;
        }

        // Update metrics
        if (data.metrics) {
            this.updateMetrics(data.metrics);
        }

        // Update training state
        if (data.status === 'completed' || data.status === 'error' || data.status === 'stopped') {
            this.setTrainingState(false);
            
            if (data.status === 'completed') {
                this.showNotification('Training completed successfully!', 'success');
                this.updateModelInfo();
            }
        }
    }

    updateMetrics(metrics) {
        if (this.metricsDisplay.loss) {
            this.metricsDisplay.loss.textContent = metrics.loss ? metrics.loss.toFixed(4) : '--';
        }
        if (this.metricsDisplay.accuracy) {
            this.metricsDisplay.accuracy.textContent = metrics.accuracy ? 
                `${(metrics.accuracy * 100).toFixed(2)}%` : '--';
        }
        if (this.metricsDisplay.valLoss) {
            this.metricsDisplay.valLoss.textContent = metrics.valLoss ? metrics.valLoss.toFixed(4) : '--';
        }
        if (this.metricsDisplay.valAccuracy) {
            this.metricsDisplay.valAccuracy.textContent = metrics.valAccuracy ? 
                `${(metrics.valAccuracy * 100).toFixed(2)}%` : '--';
        }
    }

    clearMetrics() {
        Object.values(this.metricsDisplay).forEach(element => {
            if (element) element.textContent = '--';
        });
    }

    addLogEntry(logEntry) {
        if (!this.logContainer) return;

        const logElement = document.createElement('div');
        logElement.className = `log-entry ${logEntry.level}`;
        
        const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
        logElement.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-level">${logEntry.level.toUpperCase()}</span>
            <span class="log-message">${logEntry.message}</span>
        `;

        this.logContainer.appendChild(logElement);
        this.logBuffer.push(logEntry);

        // Keep only last maxLogs entries
        if (this.logBuffer.length > this.maxLogs) {
            this.logBuffer = this.logBuffer.slice(-this.maxLogs);
            const oldEntries = this.logContainer.querySelectorAll('.log-entry');
            if (oldEntries.length > this.maxLogs) {
                for (let i = 0; i < oldEntries.length - this.maxLogs; i++) {
                    oldEntries[i].remove();
                }
            }
        }

        // Auto-scroll if enabled
        const autoScroll = document.getElementById('auto-scroll-logs');
        if (autoScroll && autoScroll.checked && this.logContainer) {
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
    }

    clearLogs() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
        this.logBuffer = [];
        this.addLogEntry({
            level: 'info',
            message: 'Logs cleared',
            timestamp: new Date().toISOString()
        });
    }

    exportLogs() {
        const logsText = this.logBuffer.map(log => 
            `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-training-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.addLogEntry({
            level: 'info',
            message: 'Logs exported successfully',
            timestamp: new Date().toISOString()
        });
    }

    setTrainingState(isTraining) {
        const startBtn = document.getElementById('start-training-btn');
        const stopBtn = document.getElementById('stop-training-btn');
        const modelSelect = document.getElementById('model-type');

        if (startBtn) startBtn.disabled = isTraining;
        if (stopBtn) stopBtn.disabled = !isTraining;
        if (modelSelect) modelSelect.disabled = isTraining;

        // Update status color
        if (this.statusDisplay) {
            this.statusDisplay.className = isTraining ? 'status-value training' : 'status-value ready';
        }
    }

    updateModelInfo(modelType = null) {
        const selectedModel = modelType || document.getElementById('model-type')?.value;
        const modelInfo = window.aiBackend?.getModelStatus(selectedModel);
        const container = document.getElementById('model-info-content');

        if (!container || !modelInfo) return;

        container.innerHTML = `
            <div class="model-details">
                <div class="model-detail">
                    <label>Name:</label>
                    <span>${modelInfo.name}</span>
                </div>
                <div class="model-detail">
                    <label>Version:</label>
                    <span>${modelInfo.version}</span>
                </div>
                <div class="model-detail">
                    <label>Accuracy:</label>
                    <span>${(modelInfo.accuracy * 100).toFixed(2)}%</span>
                </div>
                <div class="model-detail">
                    <label>Status:</label>
                    <span class="status-${modelInfo.status}">${modelInfo.status}</span>
                </div>
                <div class="model-detail">
                    <label>Last Trained:</label>
                    <span>${modelInfo.lastTrained ? 
                        new Date(modelInfo.lastTrained).toLocaleString() : 'Never'}</span>
                </div>
            </div>
        `;
    }

    getTrainingData() {
        // Get training data from global aiTrainingData variable
        return window.aiTrainingData || [];
    }

    calculateETA(currentEpoch, totalEpochs, progress) {
        if (currentEpoch === 0 || progress === 0) return '--';
        
        const epochsRemaining = totalEpochs - currentEpoch;
        const timePerEpoch = 2000; // Approximate time per epoch in ms
        const etaMs = epochsRemaining * timePerEpoch;
        
        const minutes = Math.floor(etaMs / 60000);
        const seconds = Math.floor((etaMs % 60000) / 1000);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    formatStatus(status) {
        const statusMap = {
            'ready': 'Ready',
            'initializing': 'Initializing...',
            'training': 'Training...',
            'completed': 'Completed',
            'stopped': 'Stopped',
            'error': 'Error'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// CSS Styles for AI Training UI
const aiTrainingStyles = `
<style>
.ai-training-interface {
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 20px 0;
}

.ai-training-dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 20px;
    margin-bottom: 20px;
}

.training-controls,
.training-status,
.training-metrics,
.training-logs,
.model-info {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.training-logs {
    grid-column: 1 / -1;
}

.control-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.model-selection {
    margin-top: 15px;
}

.status-grid,
.metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
}

.status-item,
.metric-item,
.model-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 4px;
}

.status-value,
.metric-value {
    font-weight: bold;
    color: #495057;
}

.status-value.training {
    color: #007bff;
}

.status-value.ready {
    color: #28a745;
}

.progress-container {
    margin: 15px 0;
}

.progress-bar-wrapper {
    position: relative;
    background: #e9ecef;
    border-radius: 20px;
    height: 30px;
    overflow: hidden;
}

.progress-bar {
    position: relative;
    height: 100%;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #007bff, #0056b3);
    border-radius: 20px;
    transition: width 0.3s ease;
    position: relative;
}

.progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    font-size: 14px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.metrics-chart {
    margin-top: 15px;
    text-align: center;
}

.log-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.log-container {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 10px;
    background: #f8f9fa;
    font-family: 'Courier New', monospace;
    font-size: 12px;
}

.log-entry {
    display: flex;
    gap: 10px;
    margin-bottom: 5px;
    padding: 2px 0;
}

.log-entry.info { color: #495057; }
.log-entry.success { color: #28a745; }
.log-entry.warning { color: #ffc107; }
.log-entry.error { color: #dc3545; }

.log-timestamp {
    color: #6c757d;
    min-width: 80px;
}

.log-level {
    font-weight: bold;
    min-width: 60px;
}

.log-message {
    flex: 1;
}

.model-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.status-ready { color: #28a745; }
.status-training { color: #007bff; }
.status-error { color: #dc3545; }

@media (max-width: 768px) {
    .ai-training-dashboard {
        grid-template-columns: 1fr;
    }
    
    .status-grid,
    .metrics-grid {
        grid-template-columns: 1fr;
    }
    
    .control-buttons {
        flex-direction: column;
    }
}
</style>
`;

// Add styles to document
if (!document.getElementById('ai-training-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'ai-training-styles';
    styleElement.innerHTML = aiTrainingStyles.replace('<style>', '').replace('</style>', '');
    document.head.appendChild(styleElement);
}

// Global AI Training UI instance
window.aiTrainingUI = new AITrainingUI();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiTrainingUI.initialize();
    });
} else {
    window.aiTrainingUI.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AITrainingUI };
}