import DatabaseManager from './database.js';

class CodeTracker {
    constructor() {
        this.problems = [];
        this.db = new DatabaseManager();
        this.dbSubscription = null;
        this.init();
    }

    async init() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Initialize database connection
            await this.db.init();
            
            // Load problems from database
            await this.loadProblems();
            
            // Set up real-time subscription
            this.setupRealTimeSubscription();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateStats();
            this.renderProblems();
            this.renderDueToday();
            
            // Hide loading state
            this.hideLoadingState();
            
            this.showCelebration('Connected to database successfully! 🎉');
        } catch (error) {
            console.error('Failed to initialize CodeTracker:', error);
            this.showError('Failed to connect to database. Using offline mode.');
            
            // Fallback to localStorage
            this.problems = this.loadProblemsFromLocalStorage();
            this.setupEventListeners();
            this.updateStats();
            this.renderProblems();
            this.renderDueToday();
            this.hideLoadingState();
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Problem form submission
        const problemForm = document.getElementById('problemForm');
        if (problemForm) {
            problemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addProblem();
            });
            console.log('Problem form event listener added');
        }

        // Clear All button
        const clearAllBtn = document.getElementById('clearAll');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                console.log('Clear All button clicked!');
                this.showConfirmModal(
                    'Clear All Problems',
                    'Are you sure you want to clear all problems? This action cannot be undone and will remove all your progress.',
                    'Yes, Clear All',
                    () => this.clearAllProblems()
                );
            });
            console.log('Clear All button event listener added');
        } else {
            console.error('Clear All button not found!');
        }

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchProblems(e.target.value);
        });

        document.getElementById('filterCategory').addEventListener('change', () => {
            this.filterProblems();
        });

        document.getElementById('filterDifficulty').addEventListener('change', () => {
            this.filterProblems();
        });

        // Event delegation for dynamically created buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const problemId = e.target.closest('.delete-btn').dataset.problemId;
                this.deleteProblem(problemId);
            }
            if (e.target.closest('.complete-btn')) {
                const problemId = e.target.closest('.complete-btn').dataset.problemId;
                this.markCompleted(problemId);
            }
            if (e.target.closest('.view-btn')) {
                const problemId = e.target.closest('.view-btn').dataset.problemId;
                this.viewProblem(problemId);
            }
        });

        // Modal controls
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Confirmation modal controls
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') {
                this.closeConfirmModal();
            }
        });

        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        document.getElementById('confirmYes').addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
            }
            this.closeConfirmModal();
        });
    }

    async addProblem() {
        const formData = {
            name: document.getElementById('problemName').value.trim(),
            link: document.getElementById('problemLink').value.trim(),
            difficulty: document.getElementById('difficulty').value,
            category: document.getElementById('category').value,
            platform: document.getElementById('platform').value,
            dateAdded: new Date().toISOString().split('T')[0],
            id: Date.now().toString(),
            completedDates: []
        };

        if (!formData.name) {
            alert('Please enter a problem name');
            return;
        }

        try {
            // Add to database
            const newProblem = await this.db.addProblem(formData);
            
            // Add to local array
            this.problems.push(this.formatProblemFromDB(newProblem));
            
            // Update UI
            this.updateStats();
            this.renderProblems();
            this.renderDueToday();
            
            // Reset form
            document.getElementById('problemForm').reset();
            
            // Show success message
            this.showCelebration('Problem added successfully! 🎉');
        } catch (error) {
            console.error('Failed to add problem:', error);
            this.showError('Failed to add problem. Please try again.');
        }
    }

    getScheduleDates(dateAdded) {
        const addedDate = new Date(dateAdded);
        const dates = [];
        
        [3, 7, 15].forEach(days => {
            const scheduleDate = new Date(addedDate);
            scheduleDate.setDate(addedDate.getDate() + days);
            dates.push(scheduleDate.toISOString().split('T')[0]);
        });
        
        return dates;
    }

    isDueToday(problem) {
        const today = new Date().toISOString().split('T')[0];
        const scheduleDates = this.getScheduleDates(problem.dateAdded);
        
        return scheduleDates.some(date => 
            date === today && !problem.completedDates.includes(date)
        );
    }

    markCompleted(problemId, date = null) {
        const problem = this.problems.find(p => p.id === problemId);
        if (!problem) return;

        const targetDate = date || new Date().toISOString().split('T')[0];
        
        if (!problem.completedDates.includes(targetDate)) {
            problem.completedDates.push(targetDate);
            this.saveProblems();
            this.updateStats();
            this.renderProblems();
            this.renderDueToday();
            this.showCelebration('Great job! Problem marked as completed! 🎯');
        }
    }

    deleteProblem(problemId) {
        const problem = this.problems.find(p => p.id === problemId);
        if (!problem) return;
        
        this.showConfirmModal(
            'Delete Problem',
            `Are you sure you want to delete "${problem.name}"? This action cannot be undone.`,
            'Yes, Delete',
            () => {
                this.problems = this.problems.filter(p => p.id !== problemId);
                this.saveProblems();
                this.updateStats();
                this.renderProblems();
                this.renderDueToday();
                this.showCelebration('Problem deleted successfully');
            }
        );
    }

    clearAllProblems() {
        console.log('clearAllProblems called, current problems:', this.problems.length);
        this.problems = [];
        this.saveProblems();
        this.updateStats();
        this.renderProblems();
        this.renderDueToday();
        this.showCelebration('All problems cleared');
        console.log('All problems cleared successfully');
    }

    searchProblems(query) {
        const filteredProblems = this.problems.filter(problem => 
            problem.name.toLowerCase().includes(query.toLowerCase()) ||
            problem.category.toLowerCase().includes(query.toLowerCase()) ||
            problem.platform.toLowerCase().includes(query.toLowerCase())
        );
        this.renderProblems(filteredProblems);
    }

    filterProblems() {
        const categoryFilter = document.getElementById('filterCategory').value;
        const difficultyFilter = document.getElementById('filterDifficulty').value;
        
        const filteredProblems = this.problems.filter(problem => {
            const dueToday = this.isDueToday(problem);
            const categoryMatch = !categoryFilter || problem.category === categoryFilter;
            const difficultyMatch = !difficultyFilter || problem.difficulty === difficultyFilter;
            
            return dueToday && categoryMatch && difficultyMatch;
        });
        
        this.renderDueToday(filteredProblems);
    }

    renderProblems(problemsToRender = this.problems) {
        const container = document.getElementById('allProblemsList');
        
        if (problemsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <p>No problems found!</p>
                    <small>Try adjusting your search or add some problems.</small>
                </div>
            `;
            return;
        }

        container.innerHTML = problemsToRender.map(problem => {
            const scheduleDates = this.getScheduleDates(problem.dateAdded);
            const today = new Date().toISOString().split('T')[0];
            
            return `
                <div class="problem-item ${problem.completedDates.includes(today) ? 'completed' : ''}">
                    <div class="problem-header">
                        <div>
                            <div class="problem-title">${problem.name}</div>
                            ${problem.link ? `<a href="${problem.link}" target="_blank" class="problem-link">
                                <i class="fas fa-external-link-alt"></i> View Problem
                            </a>` : ''}
                        </div>
                        <div class="problem-actions">
                            <button class="action-btn view-btn" data-problem-id="${problem.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="action-btn complete-btn" data-problem-id="${problem.id}">
                                <i class="fas fa-check"></i> Complete
                            </button>
                            <button class="action-btn delete-btn" data-problem-id="${problem.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="problem-details">
                        <div class="detail-item">
                            <span class="detail-label">Difficulty</span>
                            <span class="detail-value difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Category</span>
                            <span class="detail-value">${problem.category}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Platform</span>
                            <span class="detail-value">${problem.platform}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Added</span>
                            <span class="detail-value">${this.formatDate(problem.dateAdded)}</span>
                        </div>
                    </div>
                    <div class="problem-schedule">
                        <div class="schedule-title">
                            <i class="fas fa-calendar-alt"></i> Practice Schedule (3-7-15 Rule)
                        </div>
                        <div class="schedule-dates">
                            ${scheduleDates.map(date => {
                                const isCompleted = problem.completedDates.includes(date);
                                const isDue = date === today && !isCompleted;
                                const isPast = new Date(date) < new Date(today) && !isCompleted;
                                
                                return `
                                    <div class="schedule-date ${isCompleted ? 'completed' : ''} ${isDue ? 'due' : ''}">
                                        ${this.formatDate(date)} 
                                        ${isCompleted ? '✓' : isDue ? '⏰' : isPast ? '❌' : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDueToday(problemsToRender = null) {
        const container = document.getElementById('dueTodayList');
        const dueProblems = problemsToRender || this.problems.filter(problem => this.isDueToday(problem));
        
        if (dueProblems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <p>No problems due today!</p>
                    <small>Enjoy your free time or add some problems to practice.</small>
                </div>
            `;
            return;
        }

        container.innerHTML = dueProblems.map(problem => {
            const today = new Date().toISOString().split('T')[0];
            const daysSinceAdded = Math.floor((new Date(today) - new Date(problem.dateAdded)) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="problem-item">
                    <div class="problem-header">
                        <div>
                            <div class="problem-title">${problem.name}</div>
                            ${problem.link ? `<a href="${problem.link}" target="_blank" class="problem-link">
                                <i class="fas fa-external-link-alt"></i> View Problem
                            </a>` : ''}
                        </div>
                        <div class="problem-actions">
                            <button class="action-btn complete-btn" data-problem-id="${problem.id}">
                                <i class="fas fa-check"></i> Mark Done
                            </button>
                        </div>
                    </div>
                    <div class="problem-details">
                        <div class="detail-item">
                            <span class="detail-label">Difficulty</span>
                            <span class="detail-value difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Category</span>
                            <span class="detail-value">${problem.category}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Platform</span>
                            <span class="detail-value">${problem.platform}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Review Day</span>
                            <span class="detail-value">Day ${daysSinceAdded}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    viewProblem(problemId) {
        const problem = this.problems.find(p => p.id === problemId);
        if (!problem) return;

        const scheduleDates = this.getScheduleDates(problem.dateAdded);
        const today = new Date().toISOString().split('T')[0];
        
        const modalContent = `
            <div>
                <h3>${problem.name}</h3>
                ${problem.link ? `<p><a href="${problem.link}" target="_blank" class="problem-link">
                    <i class="fas fa-external-link-alt"></i> View Problem
                </a></p>` : ''}
                
                <div class="problem-details" style="margin: 20px 0;">
                    <div class="detail-item">
                        <span class="detail-label">Difficulty</span>
                        <span class="detail-value difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Category</span>
                        <span class="detail-value">${problem.category}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Platform</span>
                        <span class="detail-value">${problem.platform}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Added</span>
                        <span class="detail-value">${this.formatDate(problem.dateAdded)}</span>
                    </div>
                </div>

                <div class="problem-schedule">
                    <div class="schedule-title">
                        <i class="fas fa-calendar-alt"></i> Practice Schedule (3-7-15 Rule)
                    </div>
                    <div class="schedule-dates">
                        ${scheduleDates.map(date => {
                            const isCompleted = problem.completedDates.includes(date);
                            const isDue = date === today && !isCompleted;
                            const isPast = new Date(date) < new Date(today) && !isCompleted;
                            
                            return `
                                <div class="schedule-date ${isCompleted ? 'completed' : ''} ${isDue ? 'due' : ''}">
                                    ${this.formatDate(date)} 
                                    ${isCompleted ? '✓' : isDue ? '⏰' : isPast ? '❌' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <strong>Completed Sessions:</strong> ${problem.completedDates.length}
                    ${problem.completedDates.length > 0 ? 
                        `<br><small>Last completed: ${this.formatDate(problem.completedDates[problem.completedDates.length - 1])}</small>` : 
                        '<br><small>No sessions completed yet</small>'
                    }
                </div>
            </div>
        `;

        document.getElementById('modalContent').innerHTML = modalContent;
        document.getElementById('modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    showConfirmModal(title, message, confirmButtonText, callback) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmYes').innerHTML = `<i class="fas fa-check"></i> ${confirmButtonText}`;
        
        // Add appropriate class based on action type
        const confirmBtn = document.getElementById('confirmYes');
        confirmBtn.className = 'confirm-btn';
        if (title.includes('Clear')) {
            confirmBtn.classList.add('clear-btn');
        } else {
            confirmBtn.classList.add('confirm-btn');
        }
        
        this.confirmCallback = callback;
        document.getElementById('confirmModal').style.display = 'block';
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.confirmCallback = null;
    }

    updateStats() {
        const totalProblems = this.problems.length;
        const dueToday = this.problems.filter(p => this.isDueToday(p)).length;
        const streak = this.calculateStreak();

        document.getElementById('totalProblems').textContent = totalProblems;
        document.getElementById('dueToday').textContent = dueToday;
        document.getElementById('streakCount').textContent = streak;
    }

    calculateStreak() {
        const today = new Date();
        let streak = 0;
        let checkDate = new Date(today);

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const hasCompletedToday = this.problems.some(problem => 
                problem.completedDates.includes(dateStr)
            );

            if (hasCompletedToday) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    showCelebration(message) {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.textContent = message;
        document.body.appendChild(celebration);

        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.parentNode.removeChild(celebration);
            }
        }, 3000);
    }

    async loadProblems() {
        try {
            const data = await this.db.getAllProblems();
            this.problems = data.map(item => this.formatProblemFromDB(item));
            return this.problems;
        } catch (error) {
            console.error('Failed to load problems from database:', error);
            // Fallback to localStorage
            return this.loadProblemsFromLocalStorage();
        }
    }

    loadProblemsFromLocalStorage() {
        const stored = localStorage.getItem('codeTracker_problems');
        return stored ? JSON.parse(stored) : [];
    }

    saveProblemsToLocalStorage() {
        localStorage.setItem('codeTracker_problems', JSON.stringify(this.problems));
    }

    formatProblemFromDB(dbProblem) {
        return {
            id: dbProblem.id,
            name: dbProblem.name,
            link: dbProblem.link,
            difficulty: dbProblem.difficulty,
            category: dbProblem.category,
            platform: dbProblem.platform,
            dateAdded: dbProblem.date_added,
            completedDates: dbProblem.completed_dates || []
        };
    }

    setupRealTimeSubscription() {
        this.dbSubscription = this.db.subscribeToChanges(async (payload) => {
            console.log('Real-time update:', payload);
            // Refresh problems on any change
            await this.loadProblems();
            this.updateStats();
            this.renderProblems();
            this.renderDueToday();
        });
    }

    showLoadingState() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingState';
        loadingDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                font-size: 1.2rem;
                color: #667eea;
            ">
                <div style="text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <div>Connecting to database...</div>
                </div>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoadingState() {
        const loadingDiv = document.getElementById('loadingState');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f56565;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 1001;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize the app
let codeTracker;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CodeTracker...');
    codeTracker = new CodeTracker();
    console.log('CodeTracker initialized:', codeTracker);
});
