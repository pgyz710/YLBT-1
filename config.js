const Config = {
    qwenApiKey: '',
    qwenApiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    
    defaultAccounts: [
        { id: 1, username: '奶奶', password: '123456', role: 'elder', avatar: '👩', childName: '小宝' },
        { id: 2, username: '爷爷', password: '123456', role: 'elder', avatar: '👨', childName: '小明' },
        { id: 3, username: '女儿', password: '123456', role: 'child', avatar: '👩‍💼', parentName: '奶奶', parentId: 1 },
        { id: 4, username: '儿子', password: '123456', role: 'child', avatar: '👨‍💼', parentName: '爷爷', parentId: 2 }
    ],
    
    setApiKey(key) {
        this.qwenApiKey = key;
        localStorage.setItem('ylbt_api_key', key);
    },
    
    getApiKey() {
        if (!this.qwenApiKey) {
            this.qwenApiKey = localStorage.getItem('ylbt_api_key') || '';
        }
        return this.qwenApiKey;
    },
    
    hasApiKey() {
        return !!this.getApiKey();
    }
};
