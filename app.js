const App = {
    currentPage: 'home',
    previousPage: null,
    currentUser: null,
    userRole: null,
    userData: { name: '王阿姨', childName: '小宝', avatar: '👩' },
    tasks: [],
    activities: [],
    myActivities: [],
    history: [],
    currentQuestion: '',
    currentAnswer: null,
    currentTask: null,
    currentActivity: null,
    speechSynthesis: window.speechSynthesis,
    mediaStream: null,
    capturedPhoto: null,
    isRecording: false,
    recognition: null,
    recognitionStopped: false,
    learningStats: { totalQuestions: 0, streak: 0, lastDate: null, badges: [] },
    messages: [],
    selectedCategory: '语文',
    communityPartners: [],
    familyActivities: [],
    healthRecords: [],
    timeBank: { hours: 0, records: [] },
    growthBank: { points: 0, records: [] },
    familyPoints: { points: 0, badges: [] },
    localWhisper: null,
    whisperLoading: false,
    audioContext: null,
    mediaRecorder: null,
    audioChunks: [],
    allBadges: [
        { id: 1, name: '初识陪伴', icon: '🌱', desc: '完成第一个任务', requirement: '完成1个任务', unlocked: false },
        { id: 2, name: '学习达人', icon: '📚', desc: '连续学习7天', requirement: '连续7天学习', unlocked: false },
        { id: 3, name: '亲情满满', icon: '❤️', desc: '获得100亲情积分', requirement: '获得100亲情积分', unlocked: false },
        { id: 4, name: '时光守护者', icon: '⏰', desc: '存入10小时时间', requirement: '存入10小时时间', unlocked: false },
        { id: 5, name: '成长之星', icon: '⭐', desc: '获得500成长积分', requirement: '获得500成长积分', unlocked: false },
        { id: 6, name: '代际传承', icon: '👨‍👩‍👧‍👦', desc: '解锁所有徽章', requirement: '解锁所有徽章', unlocked: false }
    ],
    
    defaultCommunityPartners: [
        { id: 1, name: '张阿姨', avatar: '👩', role: '邻居', distance: '50米', phone: '138****1234', available: true },
        { id: 2, name: '李医生', avatar: '👨‍⚕️', role: '社区医生', distance: '200米', phone: '139****5678', available: true },
        { id: 3, name: '王师傅', avatar: '👷', role: '物业维修', distance: '100米', phone: '137****9012', available: true },
        { id: 4, name: '陈老师', avatar: '👩‍🏫', role: '志愿者', distance: '150米', phone: '136****3456', available: true }
    ],
    
    defaultFamilyActivities: [
        { id: 1, time: '今天 09:30', content: '爷爷教小明写书法', type: '学习', icon: '✍️' },
        { id: 2, time: '今天 14:00', content: '一起包了饺子', type: '生活', icon: '🥟' },
        { id: 3, time: '昨天 16:00', content: '在公园散步', type: '活动', icon: '🚶' }
    ],
    
    defaultHealthRecords: [
        { id: 1, date: '今天', elder: '血压正常: 120/80', child: '身高: 110cm, 体重: 18kg' },
        { id: 2, date: '昨天', elder: '心率正常: 72次/分', child: '体温正常: 36.5°C' }
    ],
    
    defaultTasks: [
        { id: 1, name: '背古诗《春晓》', status: 'pending', desc: '和小宝一起背诵古诗', category: '语文', difficulty: '简单', createdBy: 'child' },
        { id: 2, name: '数学口算', status: 'pending', desc: '完成10道口算题', category: '数学', difficulty: '简单', createdBy: 'child' },
        { id: 3, name: '英语跟读', status: 'pending', desc: '跟读英语单词', category: '英语', difficulty: '中等', createdBy: 'child' }
    ],
    
    defaultActivities: [
        { id: 1, title: '亲子手工活动', date: '2026-02-22', time: '14:00', location: '社区活动中心', participants: 12, maxParticipants: 20, desc: '和孩子一起制作手工灯笼', category: '手工' },
        { id: 2, title: '老年人健康讲座', date: '2026-02-25', time: '09:30', location: '社区会议室', participants: 28, maxParticipants: 50, desc: '春季养生知识讲座', category: '健康' },
        { id: 3, title: '儿童绘画比赛', date: '2026-02-28', time: '10:00', location: '朝阳公园', participants: 45, maxParticipants: 60, desc: '主题：我的家乡', category: '艺术' }
    ],
    
    init() {
        this.checkBrowserSupport();
        this.checkLogin();
        this.bindLoginEvents();
    },
    
    checkBrowserSupport() {
        // 检查语音识别支持
        const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        this.browserSupport = {
            speechRecognition: hasSpeechRecognition,
            getUserMedia: hasGetUserMedia,
            secureContext: isSecureContext
        };
        
        console.log('浏览器支持检测:', this.browserSupport);
        
        // 如果不支持语音识别，显示提示
        if (!hasSpeechRecognition && !isSecureContext) {
            console.warn('语音功能需要HTTPS安全连接');
        }
    },
    
    checkLogin() {
        const savedUser = localStorage.getItem('ylbt_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.userRole = this.currentUser.role;
            this.showMainApp();
        } else {
            this.showLoginPage();
        }
    },
    
    showLoginPage() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        this.updateLoginOptions('elder');
    },
    
    showMainApp() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        if (this.userRole === 'elder') {
            this.loadElderData();
            this.bindEvents();
            this.showPage('home');
            this.updateGreeting();
            this.checkDailyStreak();
        } else {
            this.loadChildData();
            this.bindEvents();
            this.showPage('home');
        }
    },
    
    bindLoginEvents() {
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.updateLoginOptions(e.target.dataset.role);
            });
        });
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    },
    
    updateLoginOptions(role) {
        const select = document.getElementById('login-username');
        const accounts = Config.defaultAccounts.filter(a => a.role === role);
        select.innerHTML = '<option value="">请选择账号</option>';
        accounts.forEach(account => {
            select.innerHTML += `<option value="${account.id}">${account.username}</option>`;
        });
    },
    
    handleLogin() {
        const userId = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        if (!userId) { this.showToast('请选择账号'); return; }
        const account = Config.defaultAccounts.find(a => a.id === parseInt(userId));
        if (!account || account.password !== password) { this.showToast('密码错误'); return; }
        this.currentUser = account;
        this.userRole = account.role;
        localStorage.setItem('ylbt_current_user', JSON.stringify(account));
        this.showToast('登录成功！');
        setTimeout(() => this.showMainApp(), 500);
    },
    
    handleLogout() {
        this.currentUser = null;
        this.userRole = null;
        localStorage.removeItem('ylbt_current_user');
        this.showLoginPage();
        this.showToast('已退出登录');
    },
    
    loadElderData() {
        try {
            const savedData = localStorage.getItem('ylbt_elder_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.userData = data.userData || this.userData;
                this.tasks = data.tasks || [...this.defaultTasks];
                this.activities = data.activities || [...this.defaultActivities];
                this.myActivities = data.myActivities || [];
                this.history = data.history || [];
                this.learningStats = data.learningStats || this.learningStats;
                this.messages = data.messages || [];
                this.communityPartners = data.communityPartners || [...this.defaultCommunityPartners];
                this.familyActivities = data.familyActivities || [...this.defaultFamilyActivities];
                this.healthRecords = data.healthRecords || [...this.defaultHealthRecords];
                this.timeBank = data.timeBank || { hours: 0, records: [] };
                this.growthBank = data.growthBank || { points: 0, records: [] };
                this.familyPoints = data.familyPoints || { points: 0, badges: [] };
                this.allBadges = data.allBadges || [...this.allBadges];
            } else {
                this.tasks = [...this.defaultTasks];
                this.activities = [...this.defaultActivities];
                this.communityPartners = [...this.defaultCommunityPartners];
                this.familyActivities = [...this.defaultFamilyActivities];
                this.healthRecords = [...this.defaultHealthRecords];
            }
        } catch (e) { 
            this.tasks = [...this.defaultTasks];
            this.communityPartners = [...this.defaultCommunityPartners];
            this.familyActivities = [...this.defaultFamilyActivities];
            this.healthRecords = [...this.defaultHealthRecords];
        }
    },
    
    loadChildData() {
        try {
            const savedData = localStorage.getItem('ylbt_elder_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.tasks = data.tasks || [...this.defaultTasks];
                this.history = data.history || [];
                this.learningStats = data.learningStats || this.learningStats;
                this.messages = data.messages || [];
                this.communityPartners = data.communityPartners || [...this.defaultCommunityPartners];
                this.familyActivities = data.familyActivities || [...this.defaultFamilyActivities];
                this.healthRecords = data.healthRecords || [...this.defaultHealthRecords];
                this.timeBank = data.timeBank || { hours: 0, records: [] };
                this.growthBank = data.growthBank || { points: 0, records: [] };
                this.familyPoints = data.familyPoints || { points: 0, badges: [] };
                this.allBadges = data.allBadges || [...this.allBadges];
            } else { 
                this.tasks = [...this.defaultTasks];
                this.communityPartners = [...this.defaultCommunityPartners];
                this.familyActivities = [...this.defaultFamilyActivities];
                this.healthRecords = [...this.defaultHealthRecords];
            }
        } catch (e) { 
            this.tasks = [...this.defaultTasks];
            this.communityPartners = [...this.defaultCommunityPartners];
            this.familyActivities = [...this.defaultFamilyActivities];
            this.healthRecords = [...this.defaultHealthRecords];
        }
    },
    
    saveData() {
        try {
            localStorage.setItem('ylbt_elder_data', JSON.stringify({
                userData: this.userData, tasks: this.tasks, activities: this.activities,
                myActivities: this.myActivities, history: this.history,
                learningStats: this.learningStats, messages: this.messages,
                communityPartners: this.communityPartners,
                familyActivities: this.familyActivities,
                healthRecords: this.healthRecords,
                timeBank: this.timeBank,
                growthBank: this.growthBank,
                familyPoints: this.familyPoints,
                allBadges: this.allBadges
            }));
        } catch (e) { console.error('保存数据失败:', e); }
    },
    
    checkDailyStreak() {
        const today = new Date().toDateString();
        if (this.learningStats.lastDate !== today) {
            const lastDate = this.learningStats.lastDate ? new Date(this.learningStats.lastDate) : null;
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate && lastDate.toDateString() === yesterday.toDateString()) this.learningStats.streak++;
            else this.learningStats.streak = 1;
            this.learningStats.lastDate = today;
            this.saveData();
        }
    },
    
    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.showPage(e.currentTarget.dataset.page));
        });
    },
    
    showPage(pageName) {
        this.previousPage = this.currentPage;
        this.currentPage = pageName;
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        document.getElementById('page-container').innerHTML = this.getPageContent(pageName);
        this.bindPageEvents();
        if (pageName === 'home') this.updateGreeting();
        window.scrollTo(0, 0);
    },
    
    getPageContent(page) {
        if (this.userRole === 'child') {
            const childPages = { 
                'home': this.getChildHomePage(), 
                'tasks': this.getChildTasksPage(), 
                'community': this.getChildCommunityPage(),
                'activities': this.getChildActivitiesPage(), 
                'bank': this.getBankPage(),
                'profile': this.getChildProfilePage() 
            };
            return childPages[page] || childPages['home'];
        }
        const pages = {
            'home': this.getHomePage(), 
            'voice-input': this.getVoiceInputPage(), 
            'answer': this.getAnswerPage(),
            'share': this.getSharePage(), 
            'tasks': this.getTasksPage(), 
            'task-detail': this.getTaskDetailPage(),
            'task-complete': this.getTaskCompletePage(), 
            'achievement': this.getAchievementPage(),
            'activities': this.getActivitiesPage(), 
            'activity-detail': this.getActivityDetailPage(),
            'my-activities': this.getMyActivitiesPage(), 
            'community': this.getCommunityPage(),
            'bank': this.getBankPage(),
            'profile': this.getProfilePage()
        };
        return pages[page] || pages['home'];
    },
    
    bindPageEvents() {
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', (e) => this.handleAction(e.currentTarget.dataset.action, e.currentTarget.dataset.param));
        });
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        const textInput = document.getElementById('text-input');
        if (textInput) textInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.submitTextQuestion(); });
        const submitBtn = document.getElementById('submit-text');
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitTextQuestion());
        const homeTextInput = document.getElementById('home-text-input');
        if (homeTextInput) homeTextInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.submitHomeTextQuestion(); });
        const homeSubmitBtn = document.getElementById('home-submit-text');
        if (homeSubmitBtn) homeSubmitBtn.addEventListener('click', () => this.submitHomeTextQuestion());
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) addTaskBtn.addEventListener('click', () => this.addNewTask());
        const sendMessageBtn = document.getElementById('send-message-btn');
        if (sendMessageBtn) sendMessageBtn.addEventListener('click', () => this.sendNewMessage());
        document.querySelectorAll('.category-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedCategory = e.target.dataset.category;
            });
        });
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) {
            apiKeyInput.value = Config.getApiKey();
            apiKeyInput.addEventListener('change', (e) => { Config.setApiKey(e.target.value); this.showToast('API密钥已保存'); });
        }
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) { nameInput.value = this.userData.name; nameInput.addEventListener('change', (e) => { this.userData.name = e.target.value; this.saveData(); this.showToast('已保存'); }); }
        const childNameInput = document.getElementById('child-name-input');
        if (childNameInput) { childNameInput.value = this.userData.childName; childNameInput.addEventListener('change', (e) => { this.userData.childName = e.target.value; this.saveData(); this.showToast('已保存'); }); }
        const sosBtn = document.getElementById('sos-btn');
        if (sosBtn) {
            let pressTimer = null;
            sosBtn.addEventListener('mousedown', () => {
                pressTimer = setTimeout(() => { this.triggerSOS(); }, 3000);
            });
            sosBtn.addEventListener('mouseup', () => { if (pressTimer) { clearTimeout(pressTimer); } });
            sosBtn.addEventListener('mouseleave', () => { if (pressTimer) { clearTimeout(pressTimer); } });
            sosBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                pressTimer = setTimeout(() => { this.triggerSOS(); }, 3000);
            });
            sosBtn.addEventListener('touchend', () => { if (pressTimer) { clearTimeout(pressTimer); } });
        }
        
        const photoUpload = document.getElementById('photo-upload');
        if (photoUpload) {
            photoUpload.addEventListener('click', () => this.takePhoto());
        }
        
        const galleryUpload = document.getElementById('gallery-upload');
        if (galleryUpload) {
            galleryUpload.addEventListener('click', () => this.selectPhotoFromGallery());
        }
        
        const voiceConfirmBtn = document.getElementById('voice-confirm-btn');
        if (voiceConfirmBtn) {
            voiceConfirmBtn.addEventListener('click', () => this.voiceConfirmTask());
        }
    },
    
    callCommunityPartner(phone) {
        if (!phone) { this.showToast('正在连接社区...'); return; }
        if (phone.startsWith('tel:')) {
            window.location.href = phone;
        } else {
            window.location.href = `tel:${phone.replace(/\*/g, '0')}`;
        }
        this.showToast('正在呼叫...');
    },
    
    triggerSOS() {
        this.showToast('🚨 正在呼叫紧急联系人！');
        if (navigator.vibrate) navigator.vibrate(200);
    },
    
    async toggleVoiceRecording() { 
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            await this.startLocalVoiceRecording();
        }
    },
    
    async loadWhisperModel(statusText) {
        if (this.localWhisper) return this.localWhisper;
        if (this.whisperLoading) {
            if (statusText) statusText.textContent = '模型加载中，请稍候...';
            return null;
        }
        
        try {
            this.whisperLoading = true;
            if (statusText) statusText.textContent = '首次使用需下载语音模型(约75MB)...';
            
            const pipeline = window.transformersPipeline;
            if (!pipeline) {
                throw new Error('transformers.js 未加载');
            }
            
            this.localWhisper = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');
            this.whisperLoading = false;
            return this.localWhisper;
        } catch (error) {
            this.whisperLoading = false;
            console.error('加载Whisper模型失败:', error);
            return null;
        }
    },
    
    async startLocalVoiceRecording() {
        const voiceBtn = document.getElementById('voice-btn');
        const statusText = document.getElementById('voice-status');
        const recognizedText = document.getElementById('recognized-text');
        const waveAnimation = document.getElementById('wave-animation');
        
        // 检查是否为HTTPS或localhost
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (!isSecureContext) {
            this.showToast('语音功能需要HTTPS安全连接');
            if (statusText) statusText.textContent = '需要HTTPS安全连接';
            return;
        }
        
        // 请求麦克风权限
        let stream;
        try {
            if (statusText) statusText.textContent = '正在请求麦克风权限...';
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                } 
            });
        } catch (err) {
            let errorMsg = '无法访问麦克风';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMsg = '请允许麦克风权限：点击地址栏左侧的锁形图标，选择"允许"';
            } else if (err.name === 'NotFoundError') {
                errorMsg = '未找到麦克风设备';
            } else if (err.name === 'NotReadableError') {
                errorMsg = '麦克风被其他应用占用';
            }
            if (statusText) statusText.textContent = errorMsg;
            this.showToast(errorMsg, 4000);
            return;
        }
        
        this.isRecording = true;
        this.recognitionStopped = false;
        this.currentQuestion = '';
        this.audioChunks = [];
        
        // 更新UI
        if (voiceBtn) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<span>⏹️</span><span class="voice-btn-text">点击停止</span>';
        }
        if (statusText) statusText.textContent = '正在聆听，请说话...';
        if (recognizedText) recognizedText.textContent = '请说话...';
        if (waveAnimation) waveAnimation.classList.add('active');
        
        // 创建AudioContext和MediaRecorder
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const source = this.audioContext.createMediaStreamSource(stream);
            
            // 使用MediaRecorder录制音频
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                
                if (this.recognitionStopped) return;
                
                // 处理录制的音频
                if (statusText) statusText.textContent = '正在识别语音...';
                
                try {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    
                    // 转换为16kHz单声道PCM
                    const audioData = audioBuffer.getChannelData(0);
                    
                    // 使用本地Whisper模型识别
                    const result = await this.transcribeAudio(audioData, statusText);
                    
                    if (result && result.trim()) {
                        this.currentQuestion = result.trim();
                        if (recognizedText) recognizedText.textContent = result;
                        if (statusText) statusText.textContent = '识别完成！';
                        this.showToast('识别成功！');
                        setTimeout(() => this.generateAIAnswer(this.currentQuestion), 500);
                    } else {
                        if (statusText) statusText.textContent = '没有识别到内容，请重试';
                        this.showToast('没有识别到内容');
                    }
                } catch (error) {
                    console.error('语音识别错误:', error);
                    if (statusText) statusText.textContent = '识别失败，请重试';
                    this.showToast('识别失败，请重试');
                }
                
                this.isRecording = false;
                this.resetVoiceUI(voiceBtn, statusText, recognizedText, waveAnimation);
            };
            
            this.mediaRecorder.start();
            
            // 最多录制30秒
            setTimeout(() => {
                if (this.isRecording && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.stopVoiceRecording();
                }
            }, 30000);
            
        } catch (error) {
            console.error('录音启动失败:', error);
            this.showToast('录音启动失败，请重试');
            this.isRecording = false;
            this.resetVoiceUI(voiceBtn, statusText, recognizedText, waveAnimation);
            stream.getTracks().forEach(track => track.stop());
        }
    },
    
    async transcribeAudio(audioData, statusText) {
        try {
            // 加载Whisper模型
            const whisper = await this.loadWhisperModel(statusText);
            
            if (!whisper) {
                // 如果模型加载失败，尝试使用浏览器内置语音识别
                return await this.fallbackToWebSpeech(audioData, statusText);
            }
            
            if (statusText) statusText.textContent = '正在本地识别...';
            
            // 使用Whisper进行识别
            const result = await whisper(audioData, {
                language: 'chinese',
                task: 'transcribe',
                chunk_length_s: 30,
                stride_length_s: 5
            });
            
            return result.text || '';
        } catch (error) {
            console.error('Whisper识别失败:', error);
            return '';
        }
    },
    
    async fallbackToWebSpeech(audioData, statusText) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            throw new Error('浏览器不支持语音识别');
        }
        
        if (statusText) statusText.textContent = '使用在线识别...';
        
        return new Promise((resolve, reject) => {
            const recognition = new SpeechRecognition();
            recognition.lang = 'zh-CN';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };
            
            recognition.onerror = (event) => {
                reject(new Error(event.error));
            };
            
            recognition.start();
            
            // 5秒超时
            setTimeout(() => {
                recognition.stop();
                reject(new Error('timeout'));
            }, 5000);
        });
    },
    
    resetVoiceUI(voiceBtn, statusText, recognizedText, waveAnimation) {
        if (voiceBtn) { voiceBtn.classList.remove('recording'); voiceBtn.innerHTML = '<span>🎤</span><span class="voice-btn-text">点击说话</span>'; }
        if (waveAnimation) waveAnimation.classList.remove('active');
    },
    
    stopVoiceRecording() {
        this.isRecording = false;
        this.recognitionStopped = true;
        
        // 停止MediaRecorder
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            try {
                this.mediaRecorder.stop();
            } catch (e) {
                console.error('停止录音失败:', e);
            }
        }
        
        // 停止旧的语音识别
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                // 忽略停止时的错误
            }
        }
        
        // 重置UI
        const voiceBtn = document.getElementById('voice-btn');
        const statusText = document.getElementById('voice-status');
        const waveAnimation = document.getElementById('wave-animation');
        this.resetVoiceUI(voiceBtn, statusText, null, waveAnimation);
        
        if (statusText) statusText.textContent = '已停止';
    },
    
    submitTextQuestion() {
        const textInput = document.getElementById('text-input');
        if (textInput && textInput.value.trim()) {
            this.currentQuestion = textInput.value.trim();
            this.showToast('正在生成答案...');
            this.generateAIAnswer(this.currentQuestion);
        } else { this.showToast('请输入问题'); }
    },
    
    submitHomeTextQuestion() {
        const textInput = document.getElementById('home-text-input');
        if (textInput && textInput.value.trim()) {
            this.currentQuestion = textInput.value.trim();
            textInput.value = '';
            this.showToast('正在生成答案...');
            this.generateAIAnswer(this.currentQuestion);
        } else { this.showToast('请输入问题'); }
    },
    
    async generateAIAnswer(question) {
        this.currentQuestion = question;
        if (Config.hasApiKey()) {
            this.showToast('正在调用AI回答...');
            try { this.currentAnswer = await this.callQwenAPI(question); }
            catch (error) { this.showToast('AI回答失败，使用本地知识库'); this.currentAnswer = this.getLocalAnswer(question); }
        } else { this.currentAnswer = this.getLocalAnswer(question); }
        this.learningStats.totalQuestions++;
        this.learningStats.lastDate = new Date().toDateString();
        this.history.unshift({ question, time: this.formatTime(new Date()), answer: this.currentAnswer });
        if (this.history.length > 20) this.history = this.history.slice(0, 20);
        this.saveData();
        this.showPage('answer');
    },
    
    async callQwenAPI(question) {
        const response = await fetch(Config.qwenApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Config.getApiKey()}` },
            body: JSON.stringify({
                model: 'qwen-turbo',
                input: { messages: [
                    { role: 'system', content: '你是一个面向老人和儿童的教育助手。请用简单易懂的语言回答问题，分别给出"长辈版"（用通俗的比喻解释）和"儿童版"（用科学但易懂的语言）。请用JSON格式返回：{"elder": "长辈版答案", "child": "儿童版答案", "emoji": "相关emoji", "category": "分类"}' },
                    { role: 'user', content: question }
                ]},
                parameters: { result_format: 'message' }
            })
        });
        const data = await response.json();
        if (data.output?.choices?.[0]) {
            const content = data.output.choices[0].message.content;
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) return JSON.parse(jsonMatch[0]);
            } catch (e) {}
            return { elder: content, child: content, emoji: '🤔', category: '知识' };
        }
        throw new Error('API返回格式错误');
    },
    
    getLocalAnswer(question) {
        const q = question.toLowerCase();
        const db = {
            '恐龙': { elder: '很久以前地球上住着很多恐龙。后来一颗大石头从天上掉下来，天气变得很冷，恐龙们找不到吃的就消失了。', child: '恐龙是因为陨石撞击地球导致环境变化而灭绝的！', emoji: '🦖', category: '自然科学' },
            '天空': { elder: '天空是蓝色的是因为太阳光穿过空气时，蓝色的光最容易散开。', child: '这是光的散射现象！蓝色光波长最短，最容易被散射。', emoji: '🌤️', category: '自然科学' },
            '月亮': { elder: '月亮本身不会发光，我们看到的月光是太阳照在月亮上的光。', child: '月相变化是因为月亮绕地球公转，太阳照亮不同部分。', emoji: '🌙', category: '自然科学' },
            '太阳': { elder: '太阳是一个超级大的火球，一直在燃烧给我们光和热。', child: '太阳通过核聚变反应产生能量，表面温度约5500摄氏度。', emoji: '☀️', category: '自然科学' },
            '雨': { elder: '雨是云里的小水滴太多了，太重了就掉下来。', child: '雨是水循环的一部分，云中水滴聚集变大后降落。', emoji: '🌧️', category: '自然科学' },
            '雪': { elder: '雪是冬天天上的水蒸气冻成了小冰花飘下来。', child: '雪是水蒸气直接凝华成冰晶形成的。', emoji: '❄️', category: '自然科学' },
            '猫': { elder: '猫是很可爱的小动物，喜欢抓老鼠，走路没有声音。', child: '猫是猫科动物，有敏锐的听觉和视觉。', emoji: '🐱', category: '动物' },
            '狗': { elder: '狗是人类的好朋友，很忠诚，能帮我们看家。', child: '狗是最早被驯化的动物之一，有很强的嗅觉。', emoji: '🐕', category: '动物' },
            '飞机': { elder: '飞机是能在天上飞的交通工具，比汽车快很多。', child: '飞机利用机翼产生的升力飞行。', emoji: '✈️', category: '科技' },
            '中国': { elder: '中国是我们的祖国，很大，有五千年的历史。', child: '中国是世界上人口最多的国家之一，有悠久的历史。', emoji: '🇨🇳', category: '地理' },
            '春节': { elder: '春节是中国最重要的节日，就是过年，大家回家团圆吃饺子。', child: '春节是农历新年，人们贴春联、吃年夜饭、拜年。', emoji: '🧧', category: '文化' }
        };
        for (const key in db) { if (q.includes(key)) return db[key]; }
        return { elder: '这个问题很有趣，我们可以一起去查找答案！', child: '让我们一起去探索知识吧！', emoji: '🤔', category: '探索' };
    },
    
    handleAction(action, param) {
        switch(action) {
            case 'go-back': this.showPage(this.previousPage || 'home'); break;
            case 'go-home': this.showPage('home'); break;
            case 'start-voice': this.showPage('voice-input'); break;
            case 'show-answer': this.showPage('answer'); break;
            case 'show-share': this.showPage('share'); break;
            case 'show-task': this.currentTask = this.tasks.find(t => t.id === parseInt(param)) || this.tasks[0]; this.showPage('task-detail'); break;
            case 'complete-task': this.showPage('task-complete'); break;
            case 'confirm-photo': this.completeCurrentTask(); break;
            case 'show-achievement': this.showPage('achievement'); break;
            case 'show-activity': this.currentActivity = this.activities.find(a => a.id === parseInt(param)) || this.activities[0]; this.showPage('activity-detail'); break;
            case 'show-my-activities': this.showPage('my-activities'); break;
            case 'join-activity': this.joinActivity(); break;
            case 'checkin-activity': this.checkinActivity(); break;
            case 'play-voice': this.speakText(this.messages[this.messages.length - 1]?.content || '妈，今天降温，记得给小宝加衣服'); break;
            case 'play-answer-voice': if (this.currentAnswer?.elder) this.speakText(this.currentAnswer.elder); break;
            case 'share-result': this.shareResult(); break;
            case 'clear-history': this.history = []; this.saveData(); this.showToast('已清空'); this.showPage('profile'); break;
            case 'logout': this.handleLogout(); break;
            case 'delete-task': this.tasks = this.tasks.filter(t => t.id !== parseInt(param)); this.saveData(); this.showToast('已删除'); this.showPage('tasks'); break;
            case 'call-partner': this.callCommunityPartner(param); break;
        }
    },
    
    completeCurrentTask() {
        if (this.currentTask) {
            const task = this.tasks.find(t => t.id === this.currentTask.id);
            if (task) { 
                task.status = 'completed'; 
                this.addTaskRewards(task);
                this.saveData(); 
            }
        }
        this.showToast('任务完成！');
        setTimeout(() => this.showPage('achievement'), 1000);
    },
    
    addTaskRewards(task) {
        let growthPoints = 10;
        let familyPoints = 5;
        let timeHours = 0.5;
        
        if (task.difficulty === '中等') {
            growthPoints = 20;
            familyPoints = 10;
            timeHours = 1;
        } else if (task.difficulty === '困难') {
            growthPoints = 30;
            familyPoints = 15;
            timeHours = 1.5;
        }
        
        this.growthBank.points += growthPoints;
        this.growthBank.records.unshift({
            id: Date.now(),
            type: '任务完成',
            points: growthPoints,
            desc: `完成任务：${task.name}`,
            time: new Date().toLocaleTimeString()
        });
        
        this.familyPoints.points += familyPoints;
        
        this.timeBank.hours += timeHours;
        this.timeBank.records.unshift({
            id: Date.now(),
            type: '陪伴时长',
            hours: timeHours,
            desc: `陪伴完成：${task.name}`,
            time: new Date().toLocaleTimeString()
        });
        
        this.checkBadges();
    },
    
    checkBadges() {
        const doneCount = this.tasks.filter(t => t.status === 'completed').length;
        if (doneCount >= 1) this.unlockBadge(1);
        if (this.learningStats.streak >= 7) this.unlockBadge(2);
        if (this.familyPoints.points >= 100) this.unlockBadge(3);
        if (this.timeBank.hours >= 10) this.unlockBadge(4);
        if (this.growthBank.points >= 500) this.unlockBadge(5);
        
        const unlockedCount = this.allBadges.filter(b => b.unlocked).length;
        if (unlockedCount >= 5) this.unlockBadge(6);
    },
    
    unlockBadge(badgeId) {
        const badge = this.allBadges.find(b => b.id === badgeId);
        if (badge && !badge.unlocked) {
            badge.unlocked = true;
            this.familyPoints.badges.push(badgeId);
            this.showToast(`🎉 解锁徽章：${badge.name}！`, 3000);
        }
    },
    
    joinActivity() {
        if (!this.currentActivity) return;
        const activity = this.activities.find(a => a.id === this.currentActivity.id);
        if (!activity || activity.participants >= activity.maxParticipants) { this.showToast('活动已满员'); return; }
        if (this.myActivities.some(a => a.id === activity.id)) { this.showToast('已报名'); return; }
        activity.participants++;
        this.myActivities.push({ ...activity, joinedAt: new Date().toISOString(), status: 'registered' });
        this.saveData();
        this.showToast('报名成功！');
        setTimeout(() => this.showPage('my-activities'), 1000);
    },
    
    checkinActivity() {
        const myActivity = this.myActivities.find(a => a.id === this.currentActivity?.id);
        if (myActivity) { myActivity.status = 'checked-in'; this.saveData(); this.showToast('签到成功！'); }
    },
    
    shareResult() {
        if (navigator.share) navigator.share({ title: '银龄伴童', text: `${this.userData.name}今天学习了"${this.currentQuestion}"`, url: location.href }).catch(() => {});
        else this.showToast('已复制分享内容');
    },
    
    addNewTask() {
        const nameInput = document.getElementById('new-task-name');
        const descInput = document.getElementById('new-task-desc');
        if (!nameInput?.value.trim()) { this.showToast('请输入任务名称'); return; }
        this.tasks.push({ id: Date.now(), name: nameInput.value.trim(), desc: descInput?.value.trim() || '', status: 'pending', category: this.selectedCategory, difficulty: '中等', createdBy: 'child' });
        this.saveData();
        nameInput.value = ''; if (descInput) descInput.value = '';
        this.showToast('任务已添加！');
        this.showPage('tasks');
    },
    
    sendNewMessage() {
        const input = document.getElementById('new-message-input');
        if (!input?.value.trim()) { this.showToast('请输入留言'); return; }
        this.messages.push({ id: Date.now(), content: input.value.trim(), time: new Date().toISOString(), from: 'child' });
        this.saveData();
        input.value = '';
        this.showToast('留言已发送！');
    },
    
    speakText(text) {
        if (!this.speechSynthesis) { this.showToast('不支持语音播报'); return; }
        this.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN'; utterance.rate = 0.85;
        this.speechSynthesis.speak(utterance);
        this.showToast('正在朗读...');
    },
    
    formatTime(date) {
        const diff = new Date() - date;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    
    updateGreeting() {
        const hour = new Date().getHours();
        let g = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
        const el = document.querySelector('.greeting-text');
        if (el) el.textContent = `${g}，${this.userData.name} 🌞`;
    },
    
    getGreeting() {
        const h = new Date().getHours();
        return h < 6 ? '夜深了' : h < 12 ? '上午好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
    },
    
    getDateStr() {
        const d = new Date();
        return `${d.getMonth() + 1}月${d.getDate()}日 星期${'日一二三四五六'[d.getDay()]}`;
    },
    
    showToast(msg, duration) {
        let toast = document.querySelector('.toast');
        if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
        toast.textContent = msg; toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration || 2000);
    },
    
    getChildHomePage() {
        const parentIds = this.currentUser.parentIds || [1];
        const parents = parentIds.map(id => Config.defaultAccounts.find(a => a.id === id)).filter(Boolean);
        const parentNames = parents.map(p => p.username).join('、');
        const parentAvatars = parents.map(p => p.avatar).join('');
        const done = this.tasks.filter(t => t.status === 'completed').length;
        return `
<div class="page active">
<div class="child-header"><div class="child-title">子女端</div><button class="btn btn-outline" data-action="logout" style="padding:8px 16px;height:auto;font-size:14px">退出</button></div>
<div class="parent-status-card"><div class="parent-status-header"><div class="parent-avatar">${parentAvatars || '👵'}</div><div class="parent-info"><h3>${parentNames || '老人'}</h3><p>今日学习 ${this.learningStats.totalQuestions} 次</p></div><span class="status-badge online"><span style="width:8px;height:8px;background:#27AE60;border-radius:50%"></span>在线</span></div><div class="progress-bar" style="margin-top:12px"><div class="progress-fill" style="width:${this.tasks.length?Math.round(done/this.tasks.length*100):0}%"></div></div><p style="margin-top:8px;color:var(--color-text-light);font-size:14px">今日任务完成 ${done}/${this.tasks.length}</p></div>
<div class="api-settings-card"><h3>🔑 AI设置</h3><div class="task-input-group"><label>通义千问API密钥</label><input type="text" id="api-key-input" class="form-input" placeholder="输入API密钥后回答问题将使用AI"></div><p class="api-hint">获取方式：访问 <a href="https://dashscope.console.aliyun.com/" target="_blank">阿里云DashScope</a> 免费申请</p></div>
<div class="task-add-card"><h3>📝 布置新任务</h3><div class="task-input-group"><label>任务名称</label><input type="text" id="new-task-name" placeholder="例如：背古诗《静夜思》"></div><div class="task-input-group"><label>任务说明</label><textarea id="new-task-desc" placeholder="详细说明任务内容..."></textarea></div><div class="task-input-group"><label>任务类别</label><div class="task-category-select"><span class="category-tag active" data-category="语文">语文</span><span class="category-tag" data-category="数学">数学</span><span class="category-tag" data-category="英语">英语</span><span class="category-tag" data-category="科学">科学</span><span class="category-tag" data-category="其他">其他</span></div></div><button class="btn btn-primary btn-lg" id="add-task-btn">添加任务</button></div>
<div class="message-send-card"><h3>💬 发送留言</h3><div class="task-input-group"><textarea id="new-message-input" placeholder="给老人留言..."></textarea></div><button class="btn btn-primary btn-lg" id="send-message-btn">发送留言</button></div>
<div class="learning-history-card"><h3>📚 学习记录</h3>${this.history.length?`<div class="history-list">${this.history.slice(0,5).map(i=>`<div class="history-item"><div class="history-icon">❓</div><div class="history-content"><div class="history-question">${i.question}</div><div class="history-time">${i.time}</div></div></div>`).join('')}</div>`:`<div class="empty-state" style="padding:24px;text-align:center"><div class="empty-desc">还没有学习记录</div></div>`}</div>
</div>`;
    },
    
    getChildTasksPage() {
        return `
<div class="page active">
<div class="header"><div class="header-title">📋 任务管理</div></div>
<div class="task-add-card"><h3>📝 添加新任务</h3><div class="task-input-group"><label>任务名称</label><input type="text" id="new-task-name" placeholder="例如：背古诗"></div><div class="task-input-group"><label>任务说明</label><textarea id="new-task-desc" placeholder="详细说明"></textarea></div><div class="task-input-group"><label>任务类别</label><div class="task-category-select"><span class="category-tag active" data-category="语文">语文</span><span class="category-tag" data-category="数学">数学</span><span class="category-tag" data-category="英语">英语</span></div></div><button class="btn btn-primary btn-lg" id="add-task-btn">添加任务</button></div>
<div class="card"><div class="card-title">📋 当前任务列表</div>${this.tasks.map(t=>`<div class="task-card ${t.status}"><div class="task-header"><div class="task-status-icon ${t.status}">${t.status==='completed'?'✓':'○'}</div><div class="task-info"><div class="task-name">${t.name}</div><div class="task-meta"><span class="task-category">${t.category||'学习'}</span></div></div><button class="btn btn-outline" data-action="delete-task" data-param="${t.id}" style="padding:8px 12px;height:auto;font-size:12px">删除</button></div><div class="task-desc">${t.desc}</div></div>`).join('')}</div>
</div>`;
    },
    
    getChildActivitiesPage() {
        return `<div class="page active"><div class="header"><div class="header-title">🎉 活动管理</div></div><div class="card"><div class="card-title">📊 老人已报名活动</div>${this.myActivities.length?this.myActivities.map(a=>{const d=new Date(a.date);return`<div class="activity-item"><div class="activity-date"><div class="activity-date-day">${d.getDate()}</div><div class="activity-date-month">${d.getMonth()+1}月</div></div><div class="activity-info"><div class="activity-title">${a.title}</div><div class="activity-meta"><span>🕐 ${a.time}</span><span class="badge ${a.status==='checked-in'?'badge-success':'badge-warning'}">${a.status==='checked-in'?'已签到':'已报名'}</span></div></div></div>`}).join(''):`<div class="empty-state" style="padding:24px;text-align:center"><div class="empty-desc">老人还没有报名活动</div></div>`}</div></div>`;
    },
    
    getChildProfilePage() {
        const parentIds = this.currentUser.parentIds || [1];
        const parents = parentIds.map(id => Config.defaultAccounts.find(a => a.id === id)).filter(Boolean);
        const parentNames = parents.map(p => p.username).join('、');
        const done = this.tasks.filter(t=>t.status==='completed').length;
        return `<div class="page active"><div class="profile-header"><div class="profile-avatar">${this.currentUser.avatar}</div><div class="profile-name">${this.currentUser.username}</div><div class="profile-desc">子女端 · 管理${parentNames}的学习</div></div><div class="stats-card"><div class="stat-row"><div class="stat-item-large"><div class="stat-value">${this.tasks.length}</div><div class="stat-label">布置任务</div></div><div class="stat-item-large"><div class="stat-value">${done}</div><div class="stat-label">已完成</div></div></div></div><div class="api-settings-card"><h3>🔑 AI设置</h3><div class="task-input-group"><label>通义千问API密钥</label><input type="text" id="api-key-input" class="form-input" placeholder="输入API密钥"></div><p class="api-hint">获取方式：访问 <a href="https://dashscope.console.aliyun.com/" target="_blank">阿里云DashScope</a> 免费申请</p></div><div class="settings-group"><div class="settings-group-title">账号</div><div class="settings-item" data-action="logout"><div class="settings-label"><span class="settings-icon">🚪</span><span>退出登录</span></div><span style="color:var(--color-text-light)">→</span></div></div></div>`;
    },
    
    getHomePage() {
        const done = this.tasks.filter(t=>t.status==='completed').length;
        const progress = this.tasks.length ? Math.round(done/this.tasks.length*100) : 0;
        const lastMsg = this.messages[this.messages.length-1];
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return `
<div class="page active">
<div class="greeting"><div class="greeting-text">${this.getGreeting()}，${this.userData.name} 🌞</div><div class="greeting-date">${this.getDateStr()}</div></div>
<div class="voice-btn-container"><button class="voice-btn" data-action="start-voice"><span>🎤</span><span class="voice-btn-text">问问题</span></button></div>
${isMobile?`<div class="card" style="margin-top:12px"><div class="card-title">✏️ 输入问题</div><input type="text" id="home-text-input" placeholder="请输入您的问题..." style="width:100%;padding:16px;font-size:var(--font-body);border:2px solid var(--color-border);border-radius:var(--radius-md);outline:none"><button class="btn btn-primary" id="home-submit-text" style="margin-top:12px">提交问题</button></div>`:''}
<div class="card"><div class="card-title">📋 今日任务（${done}/${this.tasks.length}）</div>${this.tasks.slice(0,3).map(t=>`<div class="task-item" data-action="show-task" data-param="${t.id}"><div class="task-status ${t.status==='completed'?'completed':'pending'}">${t.status==='completed'?'✓':'○'}</div><div class="task-content"><div class="task-name">${t.name}</div><div class="task-desc">${t.desc}</div></div></div>`).join('')}<div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div><div class="progress-text">完成进度 ${progress}%</div></div>
${lastMsg?`<div class="card message-card"><div class="card-title">💬 子女留言</div><div class="message-content">"${lastMsg.content}"</div><div class="message-action" data-action="play-voice"><span>🔊</span><span>播放语音</span></div></div>`:''}
<div class="history-section"><div class="history-title">📚 最近问答</div>${this.history.length?this.history.slice(0,3).map(i=>`<div class="history-item" data-action="show-answer"><div class="history-icon">❓</div><div class="history-content"><div class="history-question">${i.question}</div><div class="history-time">${i.time}</div></div></div>`).join(''):`<div class="empty-state" style="padding:24px;text-align:center"><div class="empty-icon">📝</div><div class="empty-desc">还没有问答记录</div></div>`}</div>
<div class="stats-bar"><div class="stat-item"><div class="stat-icon">🔥</div><div class="stat-value">${this.learningStats.streak}</div><div class="stat-label">连续天数</div></div><div class="stat-item"><div class="stat-icon">📚</div><div class="stat-value">${this.learningStats.totalQuestions}</div><div class="stat-label">学习次数</div></div><div class="stat-item"><div class="stat-icon">✅</div><div class="stat-value">${done}</div><div class="stat-label">完成任务</div></div></div>
</div>`;
    },
    
    getVoiceInputPage() {
        const hasSR = !!(window.SpeechRecognition||window.webkitSpeechRecognition);
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
        
        let warningHtml = '';
        if (!hasSR) {
            if (isMobile) {
                warningHtml = `<div style="text-align:center;padding:16px;background:#FFF8E1;border-radius:var(--radius-md);margin-top:16px;border:2px solid #FFA726"><p style="color:#E65100">📱 移动端建议</p><p style="color:var(--color-text-light);font-size:var(--font-small)">${isWeChat?'请使用手机浏览器（如Chrome、Edge、Safari）打开':'请使用Chrome、Edge或Safari浏览器'}</p><p style="color:var(--color-text-light);font-size:var(--font-small)">也可以直接使用下方的文字输入功能</p></div>`;
            } else {
                warningHtml = `<div style="text-align:center;padding:16px;background:#FFF0F0;border-radius:var(--radius-md);margin-top:16px;border:2px solid var(--color-error)"><p style="color:var(--color-error)">⚠️ 您的浏览器不支持语音识别</p><p style="color:var(--color-text-light);font-size:var(--font-small)">请使用 Chrome、Edge 或 Safari 浏览器</p></div>`;
            }
        } else if (isMobile) {
            warningHtml = `<div style="text-align:center;padding:12px;background:#E8F5E9;border-radius:var(--radius-md);margin-top:12px;border:2px solid #4CAF50"><p style="color:#2E7D32">💡 移动端提示</p><p style="color:var(--color-text-light);font-size:var(--font-small)">如语音识别不稳定，请使用下方的文字输入</p></div>`;
        }
        
        return `<div class="page active"><div class="header"><button class="back-btn" data-action="go-back"><span>←</span><span>返回</span></button></div><div class="status-text" id="voice-status">点击按钮开始说话</div><div class="voice-btn-container"><button class="voice-btn" id="voice-btn"><span>🎤</span><span class="voice-btn-text">点击说话</span></button></div><div class="wave-animation" id="wave-animation"><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div></div><div id="recognized-text" style="text-align:center;font-size:var(--font-body);color:var(--color-text);min-height:60px;padding:16px;background:var(--color-white);border-radius:var(--radius-md);margin:16px 0">识别结果将显示在这里...</div><div class="card" style="margin-top:16px"><div class="card-title">✏️ 输入文字</div><input type="text" id="text-input" placeholder="请输入您的问题..." style="width:100%;padding:16px;font-size:var(--font-body);border:2px solid var(--color-border);border-radius:var(--radius-md);outline:none"><button class="btn btn-primary" id="submit-text" style="margin-top:12px">提交问题</button></div>${warningHtml}</div>`;
    },
    
    getAnswerPage() {
        const a = this.currentAnswer || { elder: '这是一个很好的问题！', child: '让我们一起去探索答案吧！', emoji: '🤔', category: '探索' };
        return `<div class="page active"><div class="header"><button class="back-btn" data-action="go-back"><span>←</span><span>返回</span></button><div class="header-title" style="font-size:18px;flex:1;text-align:center;margin-right:60px">问答结果</div></div><div class="question-display"><div class="question-icon">❓</div><div class="question-text">${this.currentQuestion||'问题'}</div>${a.category?`<div class="question-category">${a.category}</div>`:''}</div><div class="answer-container"><div class="answer-panel"><div class="answer-panel-title">👵 给奶奶的话</div><div class="answer-text" style="line-height:1.8">${a.elder}</div><button class="play-btn" data-action="play-answer-voice"><span>🔊</span><span>语音朗读</span></button></div><div class="answer-panel"><div class="answer-panel-title">👦 给${this.userData.childName}看的</div><div class="answer-media"><div class="answer-media-icon">${a.emoji}</div><div class="answer-media-text" style="margin:12px 0;padding:12px;background:var(--color-bg);border-radius:var(--radius-md)">${a.child}</div></div></div></div><div style="margin-top:24px"><button class="btn btn-primary btn-lg" data-action="show-share">学会了！教${this.userData.childName}去 👉</button></div></div>`;
    },
    
    getSharePage() {
        const a = this.currentAnswer || { emoji: '🦖' };
        return `<div class="page active"><div class="header"><button class="back-btn" data-action="go-back"><span>←</span><span>返回</span></button></div><div class="share-card"><div class="share-title">🎉 今日共学卡片</div><div class="share-icon">${a.emoji}</div><div class="share-message">${this.userData.name}今天学习了<br><strong>"${this.currentQuestion||'新知识'}"</strong><br>和${this.userData.childName}一起成长！</div></div><div class="achievement-grid"><div class="achievement-item"><div class="achievement-icon">📚</div><div class="achievement-count">${this.learningStats.totalQuestions}</div><div class="achievement-label">学习次数</div></div><div class="achievement-item"><div class="achievement-icon">🔥</div><div class="achievement-count">${this.learningStats.streak}</div><div class="achievement-label">连续天数</div></div><div class="achievement-item"><div class="achievement-icon">✅</div><div class="achievement-count">${this.tasks.filter(t=>t.status==='completed').length}</div><div class="achievement-label">完成任务</div></div></div><div style="margin-top:24px"><button class="btn btn-primary btn-lg" data-action="share-result">分享给家人 📱</button></div><div style="margin-top:16px"><button class="btn btn-outline btn-lg" data-action="go-home">返回首页</button></div></div>`;
    },
    
    getTasksPage() {
        const done = this.tasks.filter(t=>t.status==='completed').length;
        const progress = this.tasks.length ? Math.round(done/this.tasks.length*100) : 0;
        return `<div class="page active"><div class="header"><div class="header-title">📋 今日任务</div></div><div class="progress-card"><div class="progress-circle" style="--progress:${progress}"><div class="progress-inner"><div class="progress-value">${progress}%</div></div></div><div class="progress-info"><div class="progress-title">今日进度</div><div class="progress-detail">已完成 ${done}/${this.tasks.length} 个任务</div></div></div>${this.tasks.map(t=>`<div class="task-card ${t.status}" data-action="show-task" data-param="${t.id}"><div class="task-header"><div class="task-status-icon ${t.status}">${t.status==='completed'?'✓':'○'}</div><div class="task-info"><div class="task-name">${t.name}</div><div class="task-meta"><span class="task-category">${t.category||'学习'}</span></div></div></div><div class="task-desc">${t.desc}</div></div>`).join('')}</div>`;
    },
    
    getTaskDetailPage() {
        const t = this.currentTask || this.tasks[0] || { name: '任务', desc: '描述', category: '学习' };
        return `<div class="page active"><div class="header"><button class="back-btn" data-action="go-back"><span>←</span><span>返回</span></button></div><div class="detail-header"><div class="detail-icon">${t.category==='语文'?'📖':t.category==='数学'?'🔢':t.category==='英语'?'🔤':'📝'}</div><div class="detail-title">${t.name}</div><div class="detail-subtitle">${t.desc}</div><div class="detail-tags"><span class="tag">${t.category||'学习'}</span></div></div><div class="card"><div class="card-title">📝 任务要求</div><div class="detail-content"><div class="step-list"><div class="step-item"><div class="step-number">1</div><div class="step-content">仔细阅读任务内容</div></div><div class="step-item"><div class="step-number">2</div><div class="step-content">按照要求完成任务</div></div><div class="step-item"><div class="step-number">3</div><div class="step-content">点击确认完成</div></div></div></div></div><button class="btn btn-primary btn-lg" data-action="complete-task" style="margin-top:16px">完成任务 ✓</button></div>`;
    },
    
    getTaskCompletePage() {
        return `<div class="page active"><div class="header"><button class="back-btn" data-action="go-back"><span>←</span><span>返回</span></button></div><div class="card"><div class="card-title">📸 拍照确认</div><p style="color:var(--color-text-light);margin-bottom:16px">请拍照确认任务完成</p><div id="camera-container"><div style="display:flex;gap:12px"><div class="photo-upload" id="photo-upload" style="flex:1"><div class="photo-upload-icon">📷</div><div class="photo-upload-text">拍照</div></div><div class="photo-upload" id="gallery-upload" style="flex:1"><div class="photo-upload-icon">🖼️</div><div class="photo-upload-text">相册</div></div></div></div></div><div class="card"><div class="card-title">🎤 语音确认</div><p style="color:var(--color-text-light);margin-bottom:16px">如果不方便拍照，可以说"完成了"来确认</p><button class="btn btn-outline btn-lg" id="voice-confirm-btn"><span>🎤</span><span>语音确认</span></button></div></div>`;
    },
    
    getAchievementPage() {
        const done = this.tasks.filter(t=>t.status==='completed').length;
        return `<div class="page active"><div class="header"><button class="back-btn" data-action="go-back"><span>←</span><span>返回</span></button></div><div class="share-card"><div class="share-title">🏆 今日成就</div><div class="share-icon">🎉</div><div class="share-message">${this.userData.name}今天完成了<br><strong>${done}个任务</strong><br>太棒了！</div></div><div class="achievement-grid"><div class="achievement-item"><div class="achievement-icon">📚</div><div class="achievement-count">${done}</div><div class="achievement-label">完成任务</div></div><div class="achievement-item"><div class="achievement-icon">⏰</div><div class="achievement-count">${Math.floor(Math.random()*30+15)}</div><div class="achievement-label">学习分钟</div></div><div class="achievement-item"><div class="achievement-icon">❓</div><div class="achievement-count">${this.learningStats.totalQuestions}</div><div class="achievement-label">回答问题</div></div></div><button class="btn btn-primary btn-lg" data-action="share-result" style="margin-top:16px">分享给家人 📱</button><button class="btn btn-outline btn-lg" data-action="go-home" style="margin-top:16px">返回首页</button></div>`;
    },
    
    getActivitiesPage() {
        return `<div class="page active"><div class="header"><div class="header-title">🎉 社区活动</div><button class="btn btn-outline" data-action="show-my-activities" style="padding:8px 16px;height:auto;font-size:16px">我的活动</button></div>${this.activities.map(a=>{const d=new Date(a.date);const expired=d<new Date();const full=a.participants>=a.maxParticipants;const joined=this.myActivities.some(m=>m.id===a.id);return`<div class="activity-item ${expired?'expired':''}" data-action="show-activity" data-param="${a.id}"><div class="activity-date"><div class="activity-date-day">${d.getDate()}</div><div class="activity-date-month">${d.getMonth()+1}月</div></div><div class="activity-info"><div class="activity-title">${a.title}</div><div class="activity-meta"><span>🕐 ${a.time}</span><span>📍 ${a.location}</span></div><div class="activity-status">${joined?'<span class="badge badge-success">已报名</span>':''}${full?'<span class="badge badge-warning">已满员</span>':''}${expired?'<span class="badge badge-default">已结束</span>':''}</div></div></div>`}).join('')}</div>`;
    },
    
    getActivityDetailPage() {
        const a = this.currentActivity || this.activities[0];
        if (!a) return this.getActivitiesPage();
        const d = new Date(a.date);
        const expired = d < new Date();
        const full = a.participants >= a.maxParticipants;
        const joined = this.myActivities.some(m => m.id === a.id);
        return `<div class="page active"><div class="header"><button class="back-btn" data-action="go-back"><span>←</span><span>返回</span></button></div><div class="detail-header"><div class="detail-icon">${a.category==='手工'?'🎨':a.category==='健康'?'💪':a.category==='艺术'?'🖼️':'🎉'}</div><div class="detail-title">${a.title}</div><div class="detail-subtitle">${a.desc}</div></div><div class="card"><div class="card-title">📅 活动时间</div><div class="detail-content">${d.getMonth()+1}月${d.getDate()}日（周${'日一二三四五六'[d.getDay()]}）${a.time}</div></div><div class="card"><div class="card-title">📍 活动地点</div><div class="detail-content">${a.location}</div></div><div class="card"><div class="card-title">👥 报名情况</div><div class="participants"><div class="participant-avatars">${Array(Math.min(4,a.participants)).fill().map(()=>'👤').join('')}</div><div class="participant-count">已有${a.participants}人报名，限${a.maxParticipants}人</div></div><div class="progress-bar" style="margin-top:12px"><div class="progress-fill" style="width:${a.participants/a.maxParticipants*100}%"></div></div></div>${joined?`<button class="btn btn-outline btn-lg" data-action="checkin-activity" style="margin-top:16px">🎫 签到入场</button>`:expired?`<button class="btn btn-outline btn-lg disabled" style="margin-top:16px" disabled>活动已结束</button>`:full?`<button class="btn btn-outline btn-lg disabled" style="margin-top:16px" disabled>已满员</button>`:`<button class="btn btn-primary btn-lg" data-action="join-activity" style="margin-top:16px">立即报名 ✓</button>`}</div>`;
    },
    
    getMyActivitiesPage() {
        return `<div class="page active"><div class="header"><button class="back-btn" data-action="go-back"><span>←</span><span>返回</span></button><div class="header-title">我的活动</div></div>${this.myActivities.length?`<div class="card"><div class="card-title">✅ 已报名活动</div>${this.myActivities.map(a=>{const d=new Date(a.date);return`<div class="activity-item" data-action="show-activity" data-param="${a.id}"><div class="activity-date"><div class="activity-date-day">${d.getDate()}</div><div class="activity-date-month">${d.getMonth()+1}月</div></div><div class="activity-info"><div class="activity-title">${a.title}</div><div class="activity-meta"><span>🕐 ${a.time}</span><span class="badge ${a.status==='checked-in'?'badge-success':'badge-warning'}">${a.status==='checked-in'?'已签到':'已报名'}</span></div></div></div>`}).join('')}</div><div class="card"><div class="card-title">🎫 签到凭证</div><div class="qr-code">📱</div><p style="text-align:center;color:var(--color-text-light)">活动当天出示此二维码签到</p></div>`:`<div class="empty-state" style="padding:48px;text-align:center"><div class="empty-icon" style="font-size:64px">📋</div><div class="empty-desc" style="margin-top:16px;font-size:18px">还没有报名活动</div><button class="btn btn-primary" data-action="go-back" style="margin-top:24px">去看看活动</button></div>`}</div>`;
    },
    
    getProfilePage() {
        return `<div class="page active"><div class="profile-header"><div class="profile-avatar">${this.userData.avatar}</div><div class="profile-name">${this.userData.name}</div><div class="profile-desc">和${this.userData.childName}一起成长</div></div><div class="stats-card"><div class="stat-row"><div class="stat-item-large"><div class="stat-value">${this.learningStats.streak}</div><div class="stat-label">连续学习天数</div></div><div class="stat-item-large"><div class="stat-value">${this.learningStats.totalQuestions}</div><div class="stat-label">累计学习次数</div></div></div></div><div class="settings-group"><div class="settings-group-title">个人信息</div><div class="settings-item"><div class="settings-label"><span class="settings-icon">👤</span><span>我的名字</span></div><input type="text" id="user-name-input" style="border:none;text-align:right;font-size:16px;width:120px"></div><div class="settings-item"><div class="settings-label"><span class="settings-icon">👶</span><span>孩子名字</span></div><input type="text" id="child-name-input" style="border:none;text-align:right;font-size:16px;width:120px"></div></div><div class="settings-group"><div class="settings-group-title">数据管理</div><div class="settings-item" data-action="clear-history"><div class="settings-label"><span class="settings-icon">🗑️</span><span>清空历史</span></div><span style="color:var(--color-text-light)">→</span></div></div><div class="settings-group"><div class="settings-group-title">账号</div><div class="settings-item" data-action="logout"><div class="settings-label"><span class="settings-icon">🚪</span><span>退出登录</span></div><span style="color:var(--color-text-light)">→</span></div></div></div>`;
    },
    
    getCommunityPage() {
        return `
<div class="page active">
<div class="header"><div class="header-title">🏘️ 社区服务</div></div>
<div class="card"><div class="card-title">🚨 应急呼叫</div><button class="btn btn-danger btn-lg" id="sos-btn" style="width:100%;padding:24px;font-size:24px">🆘 一键呼叫</button><p style="text-align:center;color:var(--color-text-light);margin-top:8px;font-size:14px">紧急情况长按3秒</p></div>
<div class="card"><div class="card-title">🤝 社区伙伴</div>${this.communityPartners.map(p=>`<div class="community-partner"><div class="partner-avatar">${p.avatar}</div><div class="partner-info"><div class="partner-name">${p.name}</div><div class="partner-role">${p.role}</div><div class="partner-distance">📍 ${p.distance}</div></div>${p.available?'<span class="status-badge online">在线</span>':'<span class="status-badge">离线</span>'}<button class="btn btn-small" data-action="call-partner" data-param="${p.phone}">呼叫</button></div>`).join('')}</div>
<div class="card"><div class="card-title">🏠 服务驿站</div><div class="service-grid"><div class="service-item"><div class="service-icon">🏥</div><div class="service-name">健康监测</div></div><div class="service-item"><div class="service-icon">👶</div><div class="service-name">临时托管</div></div><div class="service-item"><div class="service-icon">📚</div><div class="service-name">共享图书</div></div><div class="service-item"><div class="service-icon">🧸</div><div class="service-name">共享玩具</div></div></div></div>
<div class="card"><div class="card-title">💊 健康记录</div>${this.healthRecords.map(r=>`<div class="health-record"><div class="health-date">${r.date}</div><div class="health-detail"><p>👵 ${r.elder}</p><p>👶 ${r.child}</p></div></div>`).join('')}</div>
</div>`;
    },
    
    getChildCommunityPage() {
        return `
<div class="page active">
<div class="header"><div class="header-title">📡 亲情连线</div></div>
<div class="card"><div class="card-title">📋 今日共学</div>${this.familyActivities.map(a=>`<div class="family-activity"><div class="activity-icon">${a.icon}</div><div class="activity-info"><div class="activity-time">${a.time}</div><div class="activity-content">${a.content}</div></div></div>`).join('')}</div>
<div class="card"><div class="card-title">💊 健康数据</div>${this.healthRecords.map(r=>`<div class="health-record"><div class="health-date">${r.date}</div><div class="health-detail"><p>👵 ${r.elder}</p><p>👶 ${r.child}</p></div></div>`).join('')}</div>
<div class="card"><div class="card-title">📍 服务状态</div><div class="status-list"><div class="status-item"><div class="status-icon">✅</div><div class="status-text">社区服务正常</div></div><div class="status-item"><div class="status-icon">✅</div><div class="status-text">服务驿站开放中</div></div><div class="status-item"><div class="status-icon">✅</div><div class="status-text">社区伙伴在线</div></div></div></div>
<div class="card"><div class="card-title">📞 紧急联系</div>${this.communityPartners.filter(p=>['社区医生','物业维修'].includes(p.role)).map(p=>`<div class="community-partner"><div class="partner-avatar">${p.avatar}</div><div class="partner-info"><div class="partner-name">${p.name}</div><div class="partner-role">${p.role}</div></div><button class="btn btn-small" data-action="call-partner" data-param="${p.phone}">呼叫</button></div>`).join('')}</div>
</div>`;
    },
    
    getBankPage() {
        const unlockedBadges = this.allBadges.filter(b => b.unlocked);
        return `
<div class="page active">
<div class="header"><div class="header-title">🏦 双账户中心</div></div>
<div class="bank-cards">
    <div class="bank-card time-bank">
        <div class="bank-icon">⏰</div>
        <div class="bank-title">时间银行</div>
        <div class="bank-value">${this.timeBank.hours.toFixed(1)} 小时</div>
        <div class="bank-desc">陪伴时长可兑换社区服务</div>
    </div>
    <div class="bank-card growth-bank">
        <div class="bank-icon">⭐</div>
        <div class="bank-title">成长银行</div>
        <div class="bank-value">${this.growthBank.points} 积分</div>
        <div class="bank-desc">完成任务获得成长积分</div>
    </div>
</div>
<div class="card">
    <div class="card-title">❤️ 亲情积分</div>
    <div style="text-align:center;padding:24px">
        <div style="font-size:48px;margin-bottom:8px">${this.familyPoints.points}</div>
        <div style="color:var(--color-text-light)">解锁徽章：${unlockedBadges.length}/${this.allBadges.length}</div>
    </div>
</div>
<div class="card">
    <div class="card-title">🏆 荣誉徽章</div>
    <div class="badge-grid">
        ${this.allBadges.map(b=>`<div class="badge-item ${b.unlocked?'unlocked':'locked'}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.requirement}</div>
        </div>`).join('')}
    </div>
</div>
${this.timeBank.records.length?`<div class="card">
    <div class="card-title">📝 时间记录</div>
    ${this.timeBank.records.slice(0,5).map(r=>`<div class="record-item">
        <div class="record-info">
            <div class="record-title">${r.type}</div>
            <div class="record-desc">${r.desc}</div>
        </div>
        <div class="record-value">+${r.hours}h</div>
    </div>`).join('')}
</div>`:''}
${this.growthBank.records.length?`<div class="card">
    <div class="card-title">📝 积分记录</div>
    ${this.growthBank.records.slice(0,5).map(r=>`<div class="record-item">
        <div class="record-info">
            <div class="record-title">${r.type}</div>
            <div class="record-desc">${r.desc}</div>
        </div>
        <div class="record-value">+${r.points}</div>
    </div>`).join('')}
</div>`:''}
</div>`;
    },
    
    async takePhoto() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            
            const cameraContainer = document.getElementById('camera-container');
            if (cameraContainer) {
                cameraContainer.innerHTML = '';
                cameraContainer.appendChild(video);
                
                const captureBtn = document.createElement('button');
                captureBtn.className = 'btn btn-primary btn-lg';
                captureBtn.textContent = '📸 拍照';
                captureBtn.style.marginTop = '16px';
                captureBtn.addEventListener('click', () => this.capturePhoto(video, stream));
                cameraContainer.appendChild(captureBtn);
            }
        } catch (error) {
            this.showToast('无法访问相机，请检查权限');
            console.error('相机访问错误:', error);
        }
    },
    
    capturePhoto(video, stream) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        this.capturedPhoto = canvas.toDataURL('image/jpeg');
        
        stream.getTracks().forEach(track => track.stop());
        
        const cameraContainer = document.getElementById('camera-container');
        if (cameraContainer) {
            cameraContainer.innerHTML = `
                <div class="photo-preview">
                    <img src="${this.capturedPhoto}" style="width:100%;border-radius:var(--radius-md);margin-bottom:16px">
                    <button class="btn btn-primary" onclick="App.completeCurrentTask()" style="margin-right:8px">确认完成</button>
                    <button class="btn btn-outline" onclick="App.showPage('task-complete')">重新拍照</button>
                </div>
            `;
        }
        
        this.showToast('照片已拍摄');
    },
    
    selectPhotoFromGallery() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'camera';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.capturedPhoto = event.target.result;
                    
                    const cameraContainer = document.getElementById('camera-container');
                    if (cameraContainer) {
                        cameraContainer.innerHTML = `
                            <div class="photo-preview">
                                <img src="${this.capturedPhoto}" style="width:100%;border-radius:var(--radius-md);margin-bottom:16px">
                                <button class="btn btn-primary" onclick="App.completeCurrentTask()" style="margin-right:8px">确认完成</button>
                                <button class="btn btn-outline" onclick="App.showPage('task-complete')">重新选择</button>
                            </div>
                        `;
                    }
                    
                    this.showToast('照片已选择');
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    },
    
    async voiceConfirmTask() {
        this.showToast('请说"完成了"来确认任务');
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.showToast('您的浏览器不支持语音识别');
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.includes('完成了') || transcript.includes('完成') || transcript.includes('好了')) {
                this.showToast('任务已确认！');
                this.completeCurrentTask();
            } else {
                this.showToast('请说"完成了"');
            }
        };
        
        recognition.onerror = () => {
            this.showToast('语音识别失败，请重试');
        };
        
        try {
            await recognition.start();
        } catch (error) {
            this.showToast('无法启动语音识别，请检查权限');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { App.init(); });
