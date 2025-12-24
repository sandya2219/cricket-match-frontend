        const state = {
            matches: [],
            completedMatches: [],
            currentMatch: null,
            team1Players: [],
            team2Players: [],
            isLoggedIn: false,
            users: JSON.parse(localStorage.getItem('cricketUsers') || '[]'),
            scoring: {
                totalRuns: 0,
                wickets: 0,
                totalBalls: 0,
                extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
                currentOver: [],
                overHistory: [],
                batsman1: { name: "", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: "" },
                batsman2: { name: "", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: "" },
                striker: 1,
                bowler: { name: "", overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 },
                nextBatsmanIndex: 2,
                nextBowlerIndex: 1,
                pendingExtra: null,
                ballHistory: [],
                isSecondInnings: false,
                battingTeam: "",
                bowlingTeam: "",
                batsmen: [],
                bowlers: [],
                maxOvers: 0
            },
            matchToDelete: null
        };

        // Toggle between login and registration forms
        function toggleRegistrationForm() {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (registerForm.classList.contains('hidden')) {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            } else {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            }
        }
        async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Helper: Password strength check
function isStrongPassword(password) {
    // At least 8 chars, one number, one uppercase, one lowercase, one special character
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    return pattern.test(password);
}

// Simple email validation pattern
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        

        // User Registration
            async function registerUser() {
                const email = document.getElementById('registerEmail').value.trim();
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!email || !username || !password || !confirmPassword) {
                alert('Please fill all fields');
                return;
            }
            if (!emailPattern.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            if (!isStrongPassword(password)) {
                alert('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
                return;
            }
            if (state.users.find(user => user.username === username)) {
                alert('Username already exists');
                return;
            }
            
            if (state.users.find(user => user.email === email)) {
                alert('Email already registered');
                return;
            }
            const hashedPassword = await hashPassword(password);

            // Store hashed password
            state.users.push({ email, username, password: hashedPassword });
            localStorage.setItem('cricketUsers', JSON.stringify(state.users));
            
            alert('Registration successful! You can now login.');
            
            // Clear registration form and switch to login
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
            toggleRegistrationForm();
        }

        // Login System
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const hashedAttempt = await hashPassword(password);

            const user = state.users.find(u => u.username === username && u.password === hashedAttempt);

            if (user) {
                state.isLoggedIn = true;
                document.getElementById('loginSection').classList.add('hidden');
                document.getElementById('mainContent').classList.remove('hidden');
                document.getElementById('loginBtn').classList.add('hidden');
                document.getElementById('logoutBtn').classList.remove('hidden');
                updateMatchesDisplay();
            } else {
                alert('Invalid username or password');
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', function() {
            state.isLoggedIn = false;
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('mainContent').classList.add('hidden');
            document.getElementById('loginBtn').classList.remove('hidden');
            document.getElementById('logoutBtn').classList.add('hidden');
        });

        // Tab System
        function switchToTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active-tab');
                btn.classList.add('text-gray-600');
            });
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            document.getElementById(tabId).classList.add('active-tab');
            document.getElementById(tabId).classList.remove('text-gray-600');
            document.getElementById(tabId.replace('Tab', 'Section')).classList.remove('hidden');
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchToTab(btn.id));
        });

        // Player Management
        function addPlayer(team) {
            const input = document.getElementById(`team${team}Player`);
            const list = document.getElementById(`team${team}Players`);
            const count = document.getElementById(`team${team}Count`);
            const players = team === 1 ? state.team1Players : state.team2Players;
            
            const name = input.value.trim();
            if (!name) return;
            
            if (players.length >= 15) {
                alert('Maximum 15 players per team');
                return;
            }
            
            players.push(name);
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-gray-200';
            li.innerHTML = `
                <span class="font-medium">${name}</span>
                <button onclick="removePlayer(${team}, ${players.length - 1})" class="text-red-500 hover:text-red-700 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            `;
            list.appendChild(li);
            
            count.textContent = `Players: ${players.length}/15`;
            input.value = '';
            input.focus();
        }

        function removePlayer(team, index) {
            const players = team === 1 ? state.team1Players : state.team2Players;
            players.splice(index, 1);
            updatePlayersDisplay(team);
        }

        function updatePlayersDisplay(team) {
            const list = document.getElementById(`team${team}Players`);
            const count = document.getElementById(`team${team}Count`);
            const players = team === 1 ? state.team1Players : state.team2Players;
            
            list.innerHTML = '';
            players.forEach((player, index) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-gray-200 mb-2';
                li.innerHTML = `
                    <span class="font-medium">${player}</span>
                    <button onclick="removePlayer(${team}, ${index})" class="text-red-500 hover:text-red-700 transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                list.appendChild(li);
            });
            
            count.textContent = `Players: ${players.length}/15`;
        }

        // Match Creation
        document.getElementById('matchForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const team1 = document.getElementById('team1').value.trim();
            const team2 = document.getElementById('team2').value.trim();
            const overs = document.getElementById('overs').value;
            
            if (!team1 || !team2) {
                alert('Please enter both team names');
                return;
            }
            
            if (state.team1Players.length < 2 || state.team2Players.length < 2) {
                alert('Each team needs at least 2 players');
                return;
            }
            
            const match = {
                id: Date.now(),
                team1,
                team2,
                overs: parseInt(overs),
                team1Players: [...state.team1Players],
                team2Players: [...state.team2Players],
                status: 'upcoming',
                firstInnings: { battingTeam: "", bowlingTeam: "", score: "", batsmen: [], bowlers: [] },
                secondInnings: { battingTeam: "", bowlingTeam: "", score: "", batsmen: [], bowlers: [] },
                result: "",
                date: new Date().toISOString().split('T')[0],
                currentInnings: 1,
                target: 0
            };
            
            state.matches.push(match);
            
            // Reset form
            document.getElementById('team1').value = '';
            document.getElementById('team2').value = '';
            state.team1Players = [];
            state.team2Players = [];
            updatePlayersDisplay(1);
            updatePlayersDisplay(2);
            
            alert('Match created successfully!');
            switchToTab('matchesTab');
            updateMatchesDisplay();
            
            // Save to localStorage
            saveMatchesToStorage();
        });

        // Save matches to localStorage
        function saveMatchesToStorage() {
            localStorage.setItem('cricketMatches', JSON.stringify(state.matches));
            localStorage.setItem('cricketCompletedMatches', JSON.stringify(state.completedMatches));
        }

        // Load matches from localStorage
        function loadMatchesFromStorage() {
            const savedMatches = localStorage.getItem('cricketMatches');
            const savedCompletedMatches = localStorage.getItem('cricketCompletedMatches');
            
            if (savedMatches) {
                state.matches = JSON.parse(savedMatches);
            }
            
            if (savedCompletedMatches) {
                state.completedMatches = JSON.parse(savedCompletedMatches);
            }
        }

        // Delete match function
        function deleteMatch(matchId) {
            state.matchToDelete = matchId;
            document.getElementById('deleteConfirmationModal').classList.remove('hidden');
        }

        function confirmDeleteMatch() {
            if (state.matchToDelete) {
                // Remove from completed matches
                state.completedMatches = state.completedMatches.filter(match => match.id !== state.matchToDelete);
                
                // Save to localStorage
                saveMatchesToStorage();
                
                // Update display
                updateMatchesDisplay();
                
                // Close modal
                closeDeleteModal();
                
                alert('Match deleted successfully!');
            }
        }

        function closeDeleteModal() {
            state.matchToDelete = null;
            document.getElementById('deleteConfirmationModal').classList.add('hidden');
        }

        // Matches Display
        function updateMatchesDisplay() {
            const liveContainer = document.getElementById('liveMatchesContainer');
            const completedContainer = document.getElementById('completedMatchesContainer');
            const noLiveMatches = document.getElementById('noLiveMatches');
            const noCompletedMatches = document.getElementById('noCompletedMatches');
            
            // Update live matches
            const liveMatches = state.matches.filter(match => match.status === 'live' || match.status === 'upcoming');
            if (liveMatches.length === 0) {
                liveContainer.innerHTML = '';
                noLiveMatches.classList.remove('hidden');
            } else {
                noLiveMatches.classList.add('hidden');
                liveContainer.innerHTML = '';
                
                liveMatches.forEach(match => {
                    const matchCard = document.createElement('div');
                    matchCard.className = 'bg-white rounded-2xl card-shadow p-6 transition-all duration-300 hover:transform hover:scale-105';
                    
                    const statusClass = match.status === 'live' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                    const statusText = match.status === 'live' ? 'LIVE' : 'UPCOMING';
                    
                    matchCard.innerHTML = `
                        <div class="flex justify-between items-center mb-4">
                            <span class="${statusClass} px-3 py-1 rounded-full text-sm font-semibold">${statusText}</span>
                            <span class="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">${match.overs} Overs</span>
                        </div>
                        <div class="text-center mb-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-2">${match.team1} vs ${match.team2}</h3>
                            <p class="text-gray-600">${match.status === 'live' ? 'Match in progress' : 'Ready to start'}</p>
                        </div>
                        <button onclick="startMatch(${match.id})" class="w-full btn-primary transform hover:scale-105">
                            <i class="fas fa-play-circle mr-2"></i>${match.status === 'live' ? 'Continue Match' : 'Start Match'}
                        </button>
                    `;
                    liveContainer.appendChild(matchCard);
                });
            }
            
            // Update completed matches
            if (state.completedMatches.length === 0) {
                completedContainer.innerHTML = '';
                noCompletedMatches.classList.remove('hidden');
            } else {
                noCompletedMatches.classList.add('hidden');
                completedContainer.innerHTML = '';
                
                state.completedMatches.forEach(match => {
                    const matchCard = document.createElement('div');
                    matchCard.className = 'bg-white rounded-2xl card-shadow p-6 transition-all duration-300 hover:transform hover:scale-105';
                    matchCard.innerHTML = `
                        <div class="flex justify-between items-center mb-4">
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">COMPLETED</span>
                            <span class="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">${match.overs} Overs</span>
                        </div>
                        <div class="text-center mb-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-2">${match.team1} vs ${match.team2}</h3>
                            <p class="text-green-600 font-semibold mb-2">${match.result}</p>
                            <p class="text-gray-600 text-sm">${new Date(match.date).toLocaleDateString()}</p>
                        </div>
                        <div class="flex space-x-3">
                            <button onclick="viewMatchReport(${match.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all duration-300">
                                <i class="fas fa-file-alt mr-2"></i>View Report
                            </button>
                            <button onclick="deleteMatch(${match.id})" class="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold transition-all duration-300">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    completedContainer.appendChild(matchCard);
                });
            }
        }

        function viewMatchReport(matchId) {
            const match = state.completedMatches.find(m => m.id === matchId);
            if (match) {
                generateMatchReport(match);
                switchToTab('reportsTab');
            }
        }

        function startMatch(matchId) {
            const match = state.matches.find(m => m.id === matchId);
            if (match) {
                state.currentMatch = match;

                // If match is upcoming, always start from first innings
                if (match.status === 'upcoming') {
                    match.currentInnings = 1;
                    // Reset scoring to ensure fresh first innings
                    resetScoringForSecondInnings();
                    state.scoring.isSecondInnings = false;
                    state.scoring.battingTeam = match.team1;
                    state.scoring.bowlingTeam = match.team2;
                    showOpenersModal();
                } else {
                    // For live matches, continue from the saved innings state
                    if (match.currentInnings === 1) {
                        showOpenersModal();
                    } else {
                        showSecondInningsOpenersModal();
                    }
                }
            }
        }

        function showOpenersModal() {
            // Populate batsmen options
            const opener1Select = document.getElementById('opener1Select');
            const opener2Select = document.getElementById('opener2Select');
            const openingBowlerSelect = document.getElementById('openingBowlerSelect');
            
            opener1Select.innerHTML = '';
            opener2Select.innerHTML = '';
            openingBowlerSelect.innerHTML = '';
            
            // Add batsmen options (Team 1 bats first)
            state.currentMatch.team1Players.forEach(player => {
                const option1 = document.createElement('option');
                option1.value = player;
                option1.textContent = player;
                opener1Select.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = player;
                option2.textContent = player;
                opener2Select.appendChild(option2);
            });
            
            // Add bowler options (Team 2 bowls first)
            state.currentMatch.team2Players.forEach(player => {
                const option = document.createElement('option');
                option.value = player;
                option.textContent = player;
                openingBowlerSelect.appendChild(option);
            });
            
            document.getElementById('openersModal').classList.remove('hidden');
        }

        function closeOpenersModal() {
            document.getElementById('openersModal').classList.add('hidden');
        }

        function confirmOpeners() {
            const opener1 = document.getElementById('opener1Select').value;
            const opener2 = document.getElementById('opener2Select').value;
            const openingBowler = document.getElementById('openingBowlerSelect').value;
            
            if (opener1 === opener2) {
                alert('Please select two different opening batsmen');
                return;
            }
            
            // Initialize match
            state.currentMatch.status = 'live';
            state.scoring.maxOvers = state.currentMatch.overs;
            
            // Initialize scoring data with selected openers
            state.scoring.batsman1.name = opener1;
            state.scoring.batsman2.name = opener2;
            state.scoring.bowler.name = openingBowler;
            state.scoring.nextBatsmanIndex = 2;
            state.scoring.nextBowlerIndex = 1;
            state.scoring.battingTeam = state.currentMatch.team1;
            state.scoring.bowlingTeam = state.currentMatch.team2;
            state.scoring.isSecondInnings = false;
            
            // Initialize batsmen and bowlers arrays
            state.scoring.batsmen = [
                { ...state.scoring.batsman1, dismissal: "not out" },
                { ...state.scoring.batsman2, dismissal: "not out" }
            ];
            state.scoring.bowlers = [{ ...state.scoring.bowler }];
            
            updateScoringDisplay();
            document.getElementById('noScoring').classList.add('hidden');
            document.getElementById('scoringInterface').classList.remove('hidden');
            closeOpenersModal();
            switchToTab('scoringTab');
        }

        function showSecondInningsOpenersModal() {
            const opener1Select = document.getElementById('secondInningsOpener1Select');
            const opener2Select = document.getElementById('secondInningsOpener2Select');
            const bowlerSelect = document.getElementById('secondInningsBowlerSelect');
            
            opener1Select.innerHTML = '';
            opener2Select.innerHTML = '';
            bowlerSelect.innerHTML = '';
            
            // Add batsmen options (Team 2 bats second)
            state.currentMatch.team2Players.forEach(player => {
                const option1 = document.createElement('option');
                option1.value = player;
                option1.textContent = player;
                opener1Select.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = player;
                option2.textContent = player;
                opener2Select.appendChild(option2);
            });
            
            // Add bowler options (Team 1 bowls second)
            state.currentMatch.team1Players.forEach(player => {
                const option = document.createElement('option');
                option.value = player;
                option.textContent = player;
                bowlerSelect.appendChild(option);
            });
            
            document.getElementById('secondInningsOpenersModal').classList.remove('hidden');
        }

        function closeSecondInningsOpenersModal() {
            document.getElementById('secondInningsOpenersModal').classList.add('hidden');
        }

        function confirmSecondInningsOpeners() {
            const opener1 = document.getElementById('secondInningsOpener1Select').value;
            const opener2 = document.getElementById('secondInningsOpener2Select').value;
            const openingBowler = document.getElementById('secondInningsBowlerSelect').value;
            
            if (opener1 === opener2) {
                alert('Please select two different opening batsmen');
                return;
            }
            
            // Reset scoring for second innings
            resetScoringForSecondInnings();
            
            // Set new openers and bowler
            state.scoring.batsman1.name = opener1;
            state.scoring.batsman2.name = opener2;
            state.scoring.bowler.name = openingBowler;
            
            // IMPORTANT: Set second innings flag to true
            state.scoring.isSecondInnings = true;
            state.currentMatch.currentInnings = 2;
            
            // Update arrays
            state.scoring.batsmen = [
                { ...state.scoring.batsman1, dismissal: "not out" },
                { ...state.scoring.batsman2, dismissal: "not out" }
            ];
            state.scoring.bowlers = [{ ...state.scoring.bowler }];
            
            updateScoringDisplay();
            closeSecondInningsOpenersModal();
            
            // Update UI for second innings
            document.getElementById('inningsIndicator').classList.remove('hidden');
            document.getElementById('matchHeader').classList.add('second-innings-header');
            
            // Show message about target
            alert(`Second innings started! ${state.scoring.battingTeam} needs ${state.currentMatch.target} runs to win.`);
        }

        // Check if innings should end due to overs completion
        function checkOversCompletion() {
            const oversCompleted = Math.floor(state.scoring.totalBalls / 6);
            if (oversCompleted >= state.scoring.maxOvers) {
                if (!state.scoring.isSecondInnings) {
                    // First innings completed due to overs
                    endInnings(true);
                } else {
                    // Second innings completed due to overs - match over
                    endInnings(true);
                }
                return true;
            }
            return false;
        }

        // Check if innings should end due to all wickets fallen
        function checkAllOut() {
            if (state.scoring.wickets >= 10) {
                if (!state.scoring.isSecondInnings) {
                    // First innings completed due to all out
                    endInnings(true);
                } else {
                    // Second innings completed due to all out - match over
                    endInnings(true);
                }
                return true;
            }
            return false;
        }

        // Check if target achieved in second innings
        function checkTargetAchieved() {
            if (state.scoring.isSecondInnings && state.scoring.totalRuns >= state.currentMatch.target) {
                endInnings(true);
                return true;
            }
            return false;
        }

        // Scoring Functions
        function scoreBall(runs) {
            if (state.scoring.pendingExtra) {
                addExtraRuns(runs);
                return;
            }

            if (checkOversCompletion() || checkAllOut() || checkTargetAchieved()) return;

            const ball = {
                type: 'normal',
                runs: runs,
                timestamp: new Date()
            };

            processBall(ball);
        }

        function scoreWicket() {
            if (state.scoring.pendingExtra) {
                alert("Cannot take wicket on extra ball");
                return;
            }

            if (state.scoring.wickets >= 10) {
                alert("All out! Cannot take more wickets.");
                return;
            }

            showDismissalModal();
        }

        function showDismissalModal() {
            document.getElementById('dismissalModal').classList.remove('hidden');
            document.getElementById('dismissalSelect').addEventListener('change', function() {
                const fielderInput = document.getElementById('fielderInput');
                if (this.value === 'c' || this.value === 'st' || this.value === 'ro') {
                    fielderInput.classList.remove('hidden');
                } else {
                    fielderInput.classList.add('hidden');
                }
            });
        }

        function closeDismissalModal() {
            document.getElementById('dismissalModal').classList.add('hidden');
            document.getElementById('fielderInput').classList.add('hidden');
        }

        function confirmDismissal() {
            const dismissalType = document.getElementById('dismissalSelect').value;
            const fielderName = document.getElementById('fielderName').value;
            
            let dismissalText = '';
            switch(dismissalType) {
                case 'b':
                    dismissalText = `b ${state.scoring.bowler.name}`;
                    break;
                case 'c':
                    if (!fielderName) {
                        alert('Please enter fielder name for caught dismissal');
                        return;
                    }
                    dismissalText = `c ${fielderName} b ${state.scoring.bowler.name}`;
                    break;
                case 'lbw':
                    dismissalText = `lbw b ${state.scoring.bowler.name}`;
                    break;
                case 'st':
                    if (!fielderName) {
                        alert('Please enter wicketkeeper name for stumped dismissal');
                        return;
                    }
                    dismissalText = `st ${fielderName} b ${state.scoring.bowler.name}`;
                    break;
                case 'ro':
                    if (!fielderName) {
                        alert('Please enter fielder name for run out');
                        return;
                    }
                    dismissalText = `run out (${fielderName})`;
                    break;
                case 'ht':
                    dismissalText = `hit wicket b ${state.scoring.bowler.name}`;
                    break;
            }
            
            const ball = {
                type: 'wicket',
                runs: 0,
                dismissal: dismissalText,
                timestamp: new Date()
            };

            processBall(ball);
            closeDismissalModal();
        }

        function scoreExtra(extraType) {
            if (state.scoring.pendingExtra) {
                alert("Already have a pending extra");
                return;
            }

            state.scoring.pendingExtra = extraType;
            document.getElementById('extraRunsModal').classList.remove('hidden');
        }

        function addExtraRuns(runs) {
            const extraType = state.scoring.pendingExtra;
            if (!extraType) return;

            const ball = {
                type: extraType,
                runs: runs,
                timestamp: new Date()
            };

            processBall(ball);
            closeExtraModal();
        }

        function closeExtraModal() {
            state.scoring.pendingExtra = null;
            document.getElementById('extraRunsModal').classList.add('hidden');
        }

        function processBall(ball) {
            // Save current state for undo
            state.scoring.ballHistory.push(JSON.parse(JSON.stringify({
                totalRuns: state.scoring.totalRuns,
                wickets: state.scoring.wickets,
                totalBalls: state.scoring.totalBalls,
                batsman1: {...state.scoring.batsman1},
                batsman2: {...state.scoring.batsman2},
                striker: state.scoring.striker,
                bowler: {...state.scoring.bowler},
                currentOver: [...state.scoring.currentOver],
                extras: {...state.scoring.extras}
            })));

            let runsToAdd = ball.runs;
            let isWicket = ball.type === 'wicket';
            let isExtra = ball.type === 'wd' || ball.type === 'nb';

            // Update bowler stats
            if (!isExtra) {
                state.scoring.bowler.balls++;
                state.scoring.bowler.runs += runsToAdd;
            }

            // Update team totals
            state.scoring.totalRuns += runsToAdd;
            if (isExtra) {
                state.scoring.totalRuns += 1;
                state.scoring.extras[ball.type === 'wd' ? 'wides' : 'noBalls']++;
            } else {
                state.scoring.totalBalls++;
            }

            // Update batsman stats
            if ((!isExtra && !isWicket) || (ball.type === 'nb' && runsToAdd > 0)) {
                const striker = state.scoring.striker === 1 ? state.scoring.batsman1 : state.scoring.batsman2;
                striker.runs += runsToAdd;
                if (!isExtra) striker.balls++;
                
                if (runsToAdd === 4) striker.fours++;
                if (runsToAdd === 6) striker.sixes++;

                // Change strike for odd runs (except on last ball of over)
                if (runsToAdd % 2 === 1 && !isLastBallOfOver()) {
                    state.scoring.striker = state.scoring.striker === 1 ? 2 : 1;
                }
            }

            // Handle wicket
            if (isWicket) {
                state.scoring.wickets++;
                state.scoring.bowler.wickets++;
                
                const outBatsman = state.scoring.striker === 1 ? state.scoring.batsman1 : state.scoring.batsman2;
                outBatsman.isOut = true;
                outBatsman.dismissal = ball.dismissal;

                // Update batsmen array
                const batsmanIndex = state.scoring.batsmen.findIndex(b => b.name === outBatsman.name);
                if (batsmanIndex !== -1) {
                    state.scoring.batsmen[batsmanIndex] = { ...outBatsman };
                }

                // Check if all out after this wicket
                if (state.scoring.wickets >= 10) {
                    // All out - end innings
                    setTimeout(() => {
                        endInnings(true);
                    }, 500);
                } else {
                    showNewBatsmanModal();
                }
            }

            // Add ball to current over
            let ballSymbol = '';
            let ballColor = 'bg-gray-200 text-gray-800 border-2 border-gray-300';
            
            if (isWicket) {
                ballSymbol = 'W';
                ballColor = 'bg-red-500 text-white border-red-600';
            } else if (ball.type === 'wd') {
                ballSymbol = 'WD';
                ballColor = 'bg-yellow-500 text-white border-yellow-600';
            } else if (ball.type === 'nb') {
                ballSymbol = 'NB';
                ballColor = 'bg-yellow-500 text-white border-yellow-600';
            } else if (runsToAdd === 4) {
                ballSymbol = '4';
                ballColor = 'bg-blue-500 text-white border-blue-600';
            } else if (runsToAdd === 6) {
                ballSymbol = '6';
                ballColor = 'bg-purple-500 text-white border-purple-600';
            } else {
                ballSymbol = runsToAdd.toString();
                ballColor = runsToAdd === 0 ? 'bg-gray-200 text-gray-800 border-gray-300' : 'bg-green-500 text-white border-green-600';
            }

            state.scoring.currentOver.push({
                symbol: ballSymbol,
                color: ballColor,
                isExtra: isExtra,
                isWicket: isWicket
            });

            // Check if over is completed
            const legalBalls = state.scoring.currentOver.filter(ball => !ball.isExtra).length;
            if (legalBalls === 6) {
                // Change strike at the end of over (except if it's the last ball)
                if (!checkOversCompletion()) {
                    state.scoring.striker = state.scoring.striker === 1 ? 2 : 1;
                }
                
                state.scoring.overHistory.push([...state.scoring.currentOver]);
                state.scoring.currentOver = [];
                
                state.scoring.bowler.overs++;
                if (state.scoring.bowler.runs === 0) {
                    state.scoring.bowler.maidens++;
                }
                state.scoring.bowler.balls = 0;
                
                // Update bowlers array
                const bowlerIndex = state.scoring.bowlers.findIndex(b => b.name === state.scoring.bowler.name);
                if (bowlerIndex !== -1) {
                    state.scoring.bowlers[bowlerIndex] = { ...state.scoring.bowler };
                }
                
                // Check if innings should end due to overs
                if (checkOversCompletion()) {
                    return;
                }
                
                setTimeout(() => showNewBowlerModal(), 500);
            }

            // Check if target achieved in second innings
            if (state.scoring.isSecondInnings && state.scoring.totalRuns >= state.currentMatch.target) {
                setTimeout(() => {
                    endInnings(true);
                }, 500);
            }

            updateScoringDisplay();
        }

        function isLastBallOfOver() {
            const legalBalls = state.scoring.currentOver.filter(ball => !ball.isExtra).length;
            return legalBalls === 5;
        }

        function showNewBatsmanModal() {
            const select = document.getElementById('batsmanSelect');
            select.innerHTML = '';
            
            const battingTeam = state.scoring.isSecondInnings ? 
                state.currentMatch.team2Players : state.currentMatch.team1Players;
            const availablePlayers = battingTeam.slice(state.scoring.nextBatsmanIndex);
            
            availablePlayers.forEach((player, index) => {
                const option = document.createElement('option');
                option.value = state.scoring.nextBatsmanIndex + index;
                option.textContent = player;
                select.appendChild(option);
            });
            
            document.getElementById('newBatsmanModal').classList.remove('hidden');
        }

        function selectNewBatsman() {
            const select = document.getElementById('batsmanSelect');
            const selectedIndex = parseInt(select.value);
            
            const battingTeam = state.scoring.isSecondInnings ? 
                state.currentMatch.team2Players : state.currentMatch.team1Players;
            
            const newBatsman = {
                name: battingTeam[selectedIndex],
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
                dismissal: "not out"
            };
            
            if (state.scoring.striker === 1) {
                state.scoring.batsman1 = newBatsman;
            } else {
                state.scoring.batsman2 = newBatsman;
            }
            
            // Add to batsmen array
            state.scoring.batsmen.push(newBatsman);
            
            state.scoring.nextBatsmanIndex = selectedIndex + 1;
            closeBatsmanModal();
            updateScoringDisplay();
        }

        function closeBatsmanModal() {
            document.getElementById('newBatsmanModal').classList.add('hidden');
        }

        function showNewBowlerModal() {
            const select = document.getElementById('bowlerSelect');
            select.innerHTML = '';
            
            const bowlingTeam = state.scoring.isSecondInnings ? 
                state.currentMatch.team1Players : state.currentMatch.team2Players;
            const availableBowlers = bowlingTeam.filter(bowler => 
                bowler !== state.scoring.bowler.name
            );
            
            availableBowlers.forEach((bowler, index) => {
                const option = document.createElement('option');
                option.value = bowler;
                option.textContent = bowler;
                select.appendChild(option);
            });
            
            document.getElementById('newBowlerModal').classList.remove('hidden');
        }

        function selectNewBowler() {
            const select = document.getElementById('bowlerSelect');
            const selectedBowler = select.value;
            
            const newBowler = {
                name: selectedBowler,
                overs: 0,
                balls: 0,
                maidens: 0,
                runs: 0,
                wickets: 0
            };
            
            state.scoring.bowler = newBowler;
            
            // Add to bowlers array
            state.scoring.bowlers.push(newBowler);
            
            closeBowlerModal();
            updateScoringDisplay();
        }

        function closeBowlerModal() {
            document.getElementById('newBowlerModal').classList.add('hidden');
        }

        function undoLastBall() {
            if (state.scoring.ballHistory.length === 0) {
                alert("No balls to undo");
                return;
            }
            
            const previousState = state.scoring.ballHistory.pop();
            Object.assign(state.scoring, previousState);
            updateScoringDisplay();
        }

        function endInnings(oversCompleted = false) {
            let message = "Are you sure you want to end this innings?";
            if (oversCompleted) {
                message = `Innings completed! ${state.scoring.maxOvers} overs have been bowled.`;
            }
            
            if (oversCompleted || confirm(message)) {
                // Update current batsmen in the array
                const batsman1Index = state.scoring.batsmen.findIndex(b => b.name === state.scoring.batsman1.name);
                const batsman2Index = state.scoring.batsmen.findIndex(b => b.name === state.scoring.batsman2.name);
                
                if (batsman1Index !== -1) {
                    state.scoring.batsmen[batsman1Index] = { ...state.scoring.batsman1 };
                }
                if (batsman2Index !== -1) {
                    state.scoring.batsmen[batsman2Index] = { ...state.scoring.batsman2 };
                }
                
                // Update current bowler in the array
                const bowlerIndex = state.scoring.bowlers.findIndex(b => b.name === state.scoring.bowler.name);
                if (bowlerIndex !== -1) {
                    state.scoring.bowlers[bowlerIndex] = { ...state.scoring.bowler };
                }
                
                if (!state.scoring.isSecondInnings) {
                    // First innings ended
                    state.currentMatch.target = state.scoring.totalRuns + 1;
                    
                    // Save first innings data
                    state.currentMatch.firstInnings = {
                        battingTeam: state.scoring.battingTeam,
                        bowlingTeam: state.scoring.bowlingTeam,
                        score: `${state.scoring.totalRuns}/${state.scoring.wickets} (${Math.floor(state.scoring.totalBalls/6)}.${state.scoring.totalBalls%6} Ov)`,
                        batsmen: [...state.scoring.batsmen],
                        bowlers: [...state.scoring.bowlers],
                        extras: { ...state.scoring.extras }
                    };
                    
                    const alertMessage = oversCompleted ? 
                        `First innings completed! Target: ${state.currentMatch.target} runs` :
                        `First innings ended! Target: ${state.currentMatch.target} runs`;
                    
                    alert(alertMessage);
                    
                    // Show second innings openers modal
                    setTimeout(() => {
                        showSecondInningsOpenersModal();
                    }, 1000);
                } else {
                    // Second innings ended - match completed
                    const winner = state.scoring.totalRuns >= state.currentMatch.target ? 
                        state.scoring.battingTeam : state.scoring.bowlingTeam;
                    
                    // Compute a runs-only margin (difference between innings totals)
                    // First innings runs can be derived from target (target = firstInningsRuns + 1)
                    let firstInningsRuns = null;
                    if (typeof state.currentMatch.target === 'number' && !isNaN(state.currentMatch.target)) {
                        firstInningsRuns = state.currentMatch.target - 1;
                    } else if (state.currentMatch.firstInnings && state.currentMatch.firstInnings.score) {
                        // fallback: parse "<runs>/<wickets> (..." string
                        const parsed = parseInt(state.currentMatch.firstInnings.score.split('/')[0], 10);
                        firstInningsRuns = isNaN(parsed) ? 0 : parsed;
                    } else {
                        firstInningsRuns = 0;
                    }

                    const secondInningsRuns = state.scoring.totalRuns;
                    const runsMargin = Math.abs(firstInningsRuns - secondInningsRuns);

                    // Handle tie vs win
                    if (runsMargin === 0) {
                        state.currentMatch.result = `Match tied`;
                    } else {
                        state.currentMatch.result = `${winner} won by ${runsMargin} ${runsMargin === 1 ? 'run' : 'runs'}`;
                    }
                    
                    // Save second innings data
                    state.currentMatch.secondInnings = {
                        battingTeam: state.scoring.battingTeam,
                        bowlingTeam: state.scoring.bowlingTeam,
                        score: `${state.scoring.totalRuns}/${state.scoring.wickets} (${Math.floor(state.scoring.totalBalls/6)}.${state.scoring.totalBalls%6} Ov)`,
                        batsmen: [...state.scoring.batsmen],
                        bowlers: [...state.scoring.bowlers],
                        extras: { ...state.scoring.extras }
                    };
                    
                    // Move to completed matches
                    state.currentMatch.status = 'completed';
                    state.completedMatches.push(state.currentMatch);
                    state.matches = state.matches.filter(m => m.id !== state.currentMatch.id);
                    
                    // Generate match report
                    generateMatchReport(state.currentMatch);
                    
                    // Show only the winning team's score and the result (margin)
                    const firstInningsScore = state.currentMatch.firstInnings && state.currentMatch.firstInnings.score ? state.currentMatch.firstInnings.score : null;
                    const secondInningsScore = state.currentMatch.secondInnings && state.currentMatch.secondInnings.score ? state.currentMatch.secondInnings.score : null;

                    // Determine which innings belongs to the winner
                    let winnerScore = 'N/A';
                    if (firstInningsScore && state.currentMatch.firstInnings.battingTeam === winner) {
                        winnerScore = firstInningsScore;
                    } else if (secondInningsScore && state.currentMatch.secondInnings.battingTeam === winner) {
                        winnerScore = secondInningsScore;
                    } else {
                        // fallback: try matching by team names
                        if (state.currentMatch.team1 === winner && firstInningsScore) winnerScore = firstInningsScore;
                        else if (state.currentMatch.team2 === winner && secondInningsScore) winnerScore = secondInningsScore;
                    }

                    // Build alert in format B: Winner score line + runs margin line
                    if (runsMargin === 0) {
                        // Build both innings score strings if available
                        const firstScore = state.currentMatch.firstInnings && state.currentMatch.firstInnings.score ? `${state.currentMatch.firstInnings.battingTeam}: ${state.currentMatch.firstInnings.score}` : '';
                        const secondScore = state.currentMatch.secondInnings && state.currentMatch.secondInnings.score ? `${state.currentMatch.secondInnings.battingTeam}: ${state.currentMatch.secondInnings.score}` : '';
                        const scores = [firstScore, secondScore].filter(Boolean).join('\n');
                        const tieMessage = scores ? `Match is a tie\n${scores}` : 'Match is a tie';
                        alert(tieMessage);
                    } else {
                        // Format: Match Completed! Winner: TeamA (200/5) — Won by 15 runs
                        const alertMessage = `Match Completed! Winner: ${winner} (${winnerScore}) — Won by ${runsMargin} ${runsMargin === 1 ? 'run' : 'runs'}`;
                        alert(alertMessage);
                    }
                    
                    // Save to localStorage
                    saveMatchesToStorage();
                    
                    // Reset scoring interface
                    document.getElementById('noScoring').classList.remove('hidden');
                    document.getElementById('scoringInterface').classList.add('hidden');
                    state.currentMatch = null;
                    
                    updateMatchesDisplay();
                    switchToTab('reportsTab');
                }
                
                updateScoringDisplay();
            }
        }

        function resetScoringForSecondInnings() {
            state.scoring.totalRuns = 0;
            state.scoring.wickets = 0;
            state.scoring.totalBalls = 0;
            state.scoring.currentOver = [];
            state.scoring.overHistory = [];
            state.scoring.batsman1 = { 
                name: "", 
                runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: "not out"
            };
            state.scoring.batsman2 = { 
                name: "", 
                runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: "not out"
            };
            state.scoring.striker = 1;
            state.scoring.bowler = { 
                name: "", 
                overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0
            };
            state.scoring.nextBatsmanIndex = 2;
            state.scoring.nextBowlerIndex = 1;
            state.scoring.ballHistory = [];
            state.scoring.extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
            
            // Swap batting and bowling teams for second innings
            state.scoring.battingTeam = state.currentMatch.team2;
            state.scoring.bowlingTeam = state.currentMatch.team1;
            
            state.scoring.batsmen = [];
            state.scoring.bowlers = [];
        }

        function generateMatchReport(match) {
            const reportsContainer = document.getElementById('reportsContainer');
            const noReports = document.getElementById('noReports');
            
            noReports.classList.add('hidden');
            reportsContainer.classList.remove('hidden');
            
            const reportDiv = document.createElement('div');
            reportDiv.className = 'bg-white rounded-2xl card-shadow p-8';
            
            // Match result header
            reportDiv.innerHTML = `
                <div class="text-center mb-8 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-8">
                    <h3 class="text-3xl font-bold mb-4">${match.result}</h3>
                    <p class="text-xl opacity-90">${match.team1} vs ${match.team2} - ${match.overs} Overs Match</p>
                    <p class="text-lg opacity-80 mt-2">Played on ${new Date(match.date).toLocaleDateString()}</p>
                </div>
                
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                    <!-- First Innings -->
                    <div class="inning-card">
                        <h4 class="text-2xl font-bold mb-6 text-green-700 flex items-center">
                            <i class="fas fa-flag mr-3"></i>${match.firstInnings.battingTeam} ${match.firstInnings.score}
                        </h4>
                        <div class="overflow-x-auto">
                            <table class="match-report-table">
                                <thead>
                                    <tr>
                                        <th>Batter</th>
                                        <th>R</th>
                                        <th>B</th>
                                        <th>4s</th>
                                        <th>6s</th>
                                        <th>SR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${match.firstInnings.batsmen.map(batsman => `
                                        <tr>
                                            <td class="font-medium">
                                                ${batsman.name} 
                                                ${batsman.dismissal !== "not out" ? 
                                                    `<span class="text-gray-500 text-sm block">${batsman.dismissal}</span>` : 
                                                    '<span class="text-green-600 text-sm">not out</span>'
                                                }
                                            </td>
                                            <td class="font-bold">${batsman.runs}</td>
                                            <td>${batsman.balls}</td>
                                            <td>${batsman.fours}</td>
                                            <td>${batsman.sixes}</td>
                                            <td>${batsman.balls > 0 ? ((batsman.runs / batsman.balls) * 100).toFixed(2) : '0.00'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Second Innings -->
                    <div class="inning-card">
                        <h4 class="text-2xl font-bold mb-6 text-green-700 flex items-center">
                            <i class="fas fa-flag mr-3"></i>${match.secondInnings.battingTeam} ${match.secondInnings.score}
                        </h4>
                        <div class="overflow-x-auto">
                            <table class="match-report-table">
                                <thead>
                                    <tr>
                                        <th>Batter</th>
                                        <th>R</th>
                                        <th>B</th>
                                        <th>4s</th>
                                        <th>6s</th>
                                        <th>SR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${match.secondInnings.batsmen.map(batsman => `
                                        <tr>
                                            <td class="font-medium">
                                                ${batsman.name} 
                                                ${batsman.dismissal !== "not out" ? 
                                                    `<span class="text-gray-500 text-sm block">${batsman.dismissal}</span>` : 
                                                    '<span class="text-green-600 text-sm">not out</span>'
                                                }
                                            </td>
                                            <td class="font-bold">${batsman.runs}</td>
                                            <td>${batsman.balls}</td>
                                            <td>${batsman.fours}</td>
                                            <td>${batsman.sixes}</td>
                                            <td>${batsman.balls > 0 ? ((batsman.runs / batsman.balls) * 100).toFixed(2) : '0.00'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Bowling Summary -->
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
                    <h4 class="text-2xl font-bold mb-6 text-green-700 flex items-center justify-center">
                        <i class="fas fa-baseball-ball mr-3"></i>Bowling Summary
                    </h4>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div>
                            <h5 class="font-bold text-lg mb-4 text-center">${match.firstInnings.bowlingTeam} Bowling</h5>
                            <div class="overflow-x-auto">
                                <table class="match-report-table">
                                    <thead>
                                        <tr>
                                            <th>Bowler</th>
                                            <th>O</th>
                                            <th>M</th>
                                            <th>R</th>
                                            <th>W</th>
                                            <th>ECO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${match.firstInnings.bowlers.map(bowler => `
                                            <tr>
                                                <td class="font-medium">${bowler.name}</td>
                                                <td>${bowler.overs}.${bowler.balls}</td>
                                                <td>${bowler.maidens}</td>
                                                <td>${bowler.runs}</td>
                                                <td class="font-bold">${bowler.wickets}</td>
                                                <td>${bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(1) : '0.0'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h5 class="font-bold text-lg mb-4 text-center">${match.secondInnings.bowlingTeam} Bowling</h5>
                            <div class="overflow-x-auto">
                                <table class="match-report-table">
                                    <thead>
                                        <tr>
                                            <th>Bowler</th>
                                            <th>O</th>
                                            <th>M</th>
                                            <th>R</th>
                                            <th>W</th>
                                            <th>ECO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${match.secondInnings.bowlers.map(bowler => `
                                            <tr>
                                                <td class="font-medium">${bowler.name}</td>
                                                <td>${bowler.overs}.${bowler.balls}</td>
                                                <td>${bowler.maidens}</td>
                                                <td>${bowler.runs}</td>
                                                <td class="font-bold">${bowler.wickets}</td>
                                                <td>${bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(1) : '0.0'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            reportsContainer.appendChild(reportDiv);
        }

        function updateScoringDisplay() {
            if (!state.currentMatch) return;

            // Update match info
            document.getElementById('matchTitle').textContent = 
                `${state.currentMatch.team1} vs ${state.currentMatch.team2}`;
            document.getElementById('matchOvers').textContent = state.currentMatch.overs;
            document.getElementById('matchInfo').textContent = 
                `Cricket Tournament - Live Coverage`;
            
            const targetText = state.scoring.isSecondInnings ? 
                `Target: ${state.currentMatch.target} runs` : '';
            document.getElementById('currentScore').textContent = 
                `${state.scoring.totalRuns}/${state.scoring.wickets}`;
            document.getElementById('targetDisplay').textContent = targetText;
            
            const overs = Math.floor(state.scoring.totalBalls / 6);
            const balls = state.scoring.totalBalls % 6;
            document.getElementById('currentOvers').textContent = `${overs}.${balls} Overs`;
            
            const runRate = state.scoring.totalBalls > 0 ? 
                (state.scoring.totalRuns / state.scoring.totalBalls * 6).toFixed(2) : '0.00';
            document.getElementById('runRate').textContent = `CRR: ${runRate}`;

            // Update required run rate for second innings
            if (state.scoring.isSecondInnings) {
                const ballsRemaining = (state.scoring.maxOvers * 6) - state.scoring.totalBalls;
                const runsNeeded = state.currentMatch.target - state.scoring.totalRuns - 1;
                if (ballsRemaining > 0 && runsNeeded > 0) {
                    const requiredRR = (runsNeeded / ballsRemaining * 6).toFixed(2);
                    document.getElementById('requiredRate').textContent = `RRR: ${requiredRR}`;
                } else {
                    document.getElementById('requiredRate').textContent = '';
                }
            }

            // Update batsmen
            document.getElementById('batsman1Name').textContent = state.scoring.batsman1.name;
            document.getElementById('batsman1Runs').textContent = state.scoring.batsman1.runs;
            document.getElementById('batsman1Balls').textContent = `${state.scoring.batsman1.balls} balls`;
            document.getElementById('batsman14s').textContent = state.scoring.batsman1.fours;
            document.getElementById('batsman16s').textContent = state.scoring.batsman1.sixes;
            document.getElementById('batsman1SR').textContent = state.scoring.batsman1.balls > 0 ? 
                ((state.scoring.batsman1.runs / state.scoring.batsman1.balls) * 100).toFixed(1) : '0';

            document.getElementById('batsman2Name').textContent = state.scoring.batsman2.name;
            document.getElementById('batsman2Runs').textContent = state.scoring.batsman2.runs;
            document.getElementById('batsman2Balls').textContent = `${state.scoring.batsman2.balls} balls`;
            document.getElementById('batsman24s').textContent = state.scoring.batsman2.fours;
            document.getElementById('batsman26s').textContent = state.scoring.batsman2.sixes;
            document.getElementById('batsman2SR').textContent = state.scoring.batsman2.balls > 0 ? 
                ((state.scoring.batsman2.runs / state.scoring.batsman2.balls) * 100).toFixed(1) : '0';

            // Update partnership
            document.getElementById('partnershipPlayers').textContent = 
                `${state.scoring.batsman1.name} & ${state.scoring.batsman2.name}`;
            document.getElementById('partnershipRuns').textContent = 
                `${state.scoring.batsman1.runs + state.scoring.batsman2.runs} runs`;
            document.getElementById('partnershipBalls').textContent = 
                `${state.scoring.batsman1.balls + state.scoring.batsman2.balls} balls`;

            // Update bowler
            document.getElementById('bowlerName').textContent = state.scoring.bowler.name;
            document.getElementById('bowlerStats').textContent = 
                `${state.scoring.bowler.overs}-${state.scoring.bowler.maidens}-${state.scoring.bowler.runs}-${state.scoring.bowler.wickets}`;
            document.getElementById('bowlerEcon').textContent = 
                `Econ: ${state.scoring.bowler.overs > 0 ? (state.scoring.bowler.runs / state.scoring.bowler.overs).toFixed(1) : '0'}`;

            document.getElementById('bowlerOvers').textContent = state.scoring.bowler.overs;
            document.getElementById('bowlerMaidens').textContent = state.scoring.bowler.maidens;
            document.getElementById('bowlerRuns').textContent = state.scoring.bowler.runs;
            document.getElementById('bowlerWickets').textContent = state.scoring.bowler.wickets;

            // Update current over balls
            const overContainer = document.getElementById('currentOverBalls');
            overContainer.innerHTML = '';
            
            state.scoring.currentOver.forEach((ball, index) => {
                const ballDiv = document.createElement('div');
                ballDiv.className = `ball-dot ${ball.color} transition-all duration-300`;
                ballDiv.textContent = ball.symbol;
                overContainer.appendChild(ballDiv);
            });

            // Add empty balls for remaining deliveries
            const legalBalls = state.scoring.currentOver.filter(ball => !ball.isExtra).length;
            const remainingBalls = 6 - legalBalls;
            
            for (let i = 0; i < remainingBalls; i++) {
                const ballDiv = document.createElement('div');
                ballDiv.className = 'ball-dot bg-gray-200 border-2 border-gray-300';
                ballDiv.textContent = '';
                overContainer.appendChild(ballDiv);
            }

            // Update batsman active states
            document.getElementById('batsman1Name').parentElement.parentElement.classList.toggle('batsman-active', state.scoring.striker === 1);
            document.getElementById('batsman2Name').parentElement.parentElement.classList.toggle('batsman-active', state.scoring.striker === 2);
        }

        // Load matches when page loads
        window.addEventListener('DOMContentLoaded', function() {
            loadMatchesFromStorage();
            updateMatchesDisplay();
        });