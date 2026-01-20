import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Plus, TrendingUp, Camera, X, Share2, Database } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove } from 'firebase/database';

const FitnessCompetitionApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kakaoKey, setKakaoKey] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Firebase 관련 상태
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [database, setDatabase] = useState(null);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [firebaseConfigInput, setFirebaseConfigInput] = useState('');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // 하드코딩된 멤버 리스트
  const members = [
    { id: 1, name: '강동훈' },
    { id: 2, name: '권영근' },
    { id: 3, name: '서정환' },
    { id: 4, name: '정성효' },
    { id: 5, name: '조현오' },
    { id: 6, name: '천창익' },
    { id: 7, name: '황대한' }
  ];

  // 폼 상태
  const [newActivity, setNewActivity] = useState({
    user: '',
    type: '',
    distance: '',
    withFriend: false,
    photo: null
  });

  // 초기화
  useEffect(() => {
    initializeFirebase();
    loadKakaoSDK();
  }, []);

  // Firebase 초기화
  const initializeFirebase = () => {
    try {
      const savedConfig = localStorage.getItem('firebase-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        const app = initializeApp(config);
        const db = getDatabase(app);
        
        setFirebaseConfig(config);
        setDatabase(db);
        setIsFirebaseConnected(true);
        
        setupFirebaseListeners(db);
      } else {
        setShowFirebaseModal(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Firebase 초기화 실패:', error);
      setShowFirebaseModal(true);
      setLoading(false);
    }
  };

  // Firebase 리스너 설정
  const setupFirebaseListeners = (db) => {
    // 활동 기록 실시간 리스너
    const activitiesRef = ref(db, 'activities');
    onValue(activitiesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activitiesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // 날짜순으로 정렬
        activitiesList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setActivities(activitiesList);
      } else {
        setActivities([]);
      }
      setLoading(false);
    });

    // 활동 유형 실시간 리스너
    const typesRef = ref(db, 'activityTypes');
    onValue(typesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setActivityTypes(data);
      } else {
        // 기본 활동 유형 설정
        const defaultTypes = [
          { name: '러닝', multiplier: 1.0 },
          { name: '수영', multiplier: 1.5 },
          { name: '바다수영', multiplier: 2.0 },
          { name: '등산', multiplier: 1.0 },
          { name: '사이클', multiplier: 1.0 }
        ];
        setActivityTypes(defaultTypes);
        set(ref(db, 'activityTypes'), defaultTypes);
      }
    });
  };

  // Firebase 설정 저장
  const saveFirebaseConfig = () => {
    try {
      const config = JSON.parse(firebaseConfigInput);
      localStorage.setItem('firebase-config', firebaseConfigInput);
      
      const app = initializeApp(config);
      const db = getDatabase(app);
      
      setFirebaseConfig(config);
      setDatabase(db);
      setIsFirebaseConnected(true);
      setShowFirebaseModal(false);
      
      setupFirebaseListeners(db);
      alert('✅ Firebase 연결 성공! 이제 친구들과 실시간으로 데이터를 공유합니다!');
    } catch (error) {
      console.error('Firebase 설정 실패:', error);
      alert('❌ Firebase 설정 실패. JSON 형식을 확인해주세요:\n' + error.message);
    }
  };

  // 카카오톡 SDK 로드
  const loadKakaoSDK = () => {
    if (window.Kakao) {
      loadKakaoKey();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    script.onload = () => loadKakaoKey();
    document.body.appendChild(script);
  };

  const loadKakaoKey = () => {
    try {
      const keyData = localStorage.getItem('kakao-js-key');
      if (keyData && window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(keyData);
        setKakaoKey(keyData);
      }
    } catch (e) {
      console.log('카카오 키 없음');
    }
  };

  const saveKakaoKey = (key) => {
    try {
      localStorage.setItem('kakao-js-key', key);
      if (window.Kakao) {
        if (window.Kakao.isInitialized()) {
          window.Kakao.cleanup();
        }
        window.Kakao.init(key);
        setKakaoKey(key);
        alert('카카오톡 JavaScript Key가 저장되었습니다!');
      }
    } catch (error) {
      console.error('키 저장 실패:', error);
    }
  };

  const shareToKakao = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      setShowShareModal(true);
      return;
    }

    const topRanker = rankings[0];
    const totalActivities = activities.length;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '💪 FITNESS BATTLE',
        description: `현재 1등: ${topRanker?.name || '없음'} (${topRanker?.score.toFixed(1) || 0}pt)\n총 ${totalActivities}개의 운동 기록이 있습니다!`,
        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      buttons: [
        {
          title: '나도 참여하기',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      ],
    });
  };

  // 활동 기록 추가 (Firebase)
  const addActivity = () => {
    if (!database) {
      alert('Firebase가 연결되지 않았습니다. 설정을 완료해주세요!');
      setShowFirebaseModal(true);
      return;
    }

    if (!newActivity.user || !newActivity.type || !newActivity.distance) {
      alert('모든 필드를 입력해주세요!');
      return;
    }

    const activity = {
      user: newActivity.user,
      type: newActivity.type,
      distance: parseFloat(newActivity.distance),
      withFriend: newActivity.withFriend,
      photo: newActivity.photo,
      date: new Date().toISOString()
    };

    const newActivityRef = push(ref(database, 'activities'));
    set(newActivityRef, activity);
    
    setNewActivity({
      user: '',
      type: '',
      distance: '',
      withFriend: false,
      photo: null
    });
    setCurrentView('dashboard');
  };

  // 이미지 업로드
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) { // 1MB 제한
        alert('이미지 크기는 1MB 이하여야 합니다!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewActivity({ ...newActivity, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // 순위 계산
  const calculateRankings = () => {
    const scores = {};
    
    members.forEach(member => {
      scores[member.name] = 0;
    });

    activities.forEach(activity => {
      const activityType = activityTypes.find(t => t.name === activity.type);
      const multiplier = activityType ? activityType.multiplier : 1.0;
      const friendBonus = activity.withFriend ? 1.1 : 1.0;
      const score = activity.distance * multiplier * friendBonus;
      scores[activity.user] = (scores[activity.user] || 0) + score;
    });

    return Object.entries(scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);
  };

  const rankings = calculateRankings();

  const getMedalColor = (rank) => {
    if (rank === 0) return 'from-yellow-400 to-yellow-600';
    if (rank === 1) return 'from-gray-300 to-gray-500';
    if (rank === 2) return 'from-amber-600 to-amber-800';
    return 'from-blue-400 to-blue-600';
  };

  const getMedalIcon = (rank) => {
    if (rank < 3) return <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
    return <Medal className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">로딩중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-6 sm:mb-8 pt-4 sm:pt-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: 'Impact, sans-serif' }}>
            💪 FITNESS BATTLE
          </h1>
          <p className="text-white/90 text-sm sm:text-base md:text-lg font-semibold mb-2">친구들과 운동 기록 경쟁!</p>
          
          {/* Firebase 연결 상태 */}
          {isFirebaseConnected && (
            <div className="inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold mb-4">
              <Database className="w-3 h-3 sm:w-4 sm:h-4" />
              실시간 동기화 활성화
            </div>
          )}
          
          {/* 카카오톡 공유 버튼 */}
          <div className="flex justify-center gap-2">
            <button
              onClick={shareToKakao}
              className="bg-gradient-to-r from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              카카오톡 공유
            </button>
            
            {!isFirebaseConnected && (
              <button
                onClick={() => setShowFirebaseModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Firebase 설정
              </button>
            )}
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap justify-center">
          {[
            { id: 'dashboard', label: '대시보드', icon: TrendingUp },
            { id: 'record', label: '기록 입력', icon: Plus }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 ${
                currentView === id
                  ? 'bg-white text-purple-600 shadow-xl'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* 대시보드 뷰 */}
        {currentView === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {/* 순위표 */}
            <div className="bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 text-gray-800 flex items-center gap-2 sm:gap-3">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                순위표
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {rankings.map((ranking, index) => (
                  <div
                    key={ranking.name}
                    className={`bg-gradient-to-r ${getMedalColor(index)} p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl transform transition-all duration-300 hover:scale-102 hover:shadow-xl`}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                        <div className="bg-white/30 rounded-full p-2 sm:p-2.5 md:p-3">
                          {getMedalIcon(index)}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold opacity-90">#{index + 1}</div>
                          <div className="text-lg sm:text-xl md:text-2xl font-black">{ranking.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl sm:text-3xl md:text-4xl font-black">{ranking.score.toFixed(1)}</div>
                        <div className="text-xs sm:text-sm font-semibold opacity-90">포인트</div>
                      </div>
                    </div>
                  </div>
                ))}
                {rankings.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    아직 기록이 없습니다. 운동을 시작해보세요!
                  </div>
                )}
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 text-gray-800">최근 활동</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {activities.slice(0, 6).map(activity => {
                  const activityType = activityTypes.find(t => t.name === activity.type);
                  const multiplier = activityType ? activityType.multiplier : 1.0;
                  const friendBonus = activity.withFriend ? 1.1 : 1.0;
                  const score = activity.distance * multiplier * friendBonus;
                  
                  return (
                    <div key={activity.id} className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-purple-200">
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div>
                          <div className="font-black text-base sm:text-lg text-gray-800">{activity.user}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{activity.type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-xl sm:text-2xl text-purple-600">{activity.distance}km</div>
                          <div className="text-xs text-gray-500">+{score.toFixed(1)}pt</div>
                        </div>
                      </div>
                      {activity.photo && (
                        <img src={activity.photo} alt="운동 인증" className="w-full h-24 sm:h-32 object-cover rounded-lg" />
                      )}
                      {activity.withFriend && (
                        <div className="mt-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full inline-block">
                          👥 함께 운동 +10%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 기록 입력 뷰 */}
        {currentView === 'record' && (
          <div className="bg-white/95 backdrop-blur rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 text-gray-800 flex items-center gap-2 sm:gap-3">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              운동 기록 입력
            </h2>
            
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">멤버 선택</label>
                <select
                  value={newActivity.user}
                  onChange={(e) => setNewActivity({ ...newActivity, user: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-semibold text-sm sm:text-base"
                >
                  <option value="">선택하세요</option>
                  {members.map(member => (
                    <option key={member.id} value={member.name}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">운동 종류</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-semibold text-sm sm:text-base"
                >
                  <option value="">선택하세요</option>
                  {activityTypes.map((type, idx) => (
                    <option key={idx} value={type.name}>
                      {type.name} (x{type.multiplier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">거리 (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newActivity.distance}
                  onChange={(e) => setNewActivity({ ...newActivity, distance: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-semibold text-sm sm:text-base"
                  placeholder="예: 5.2"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newActivity.withFriend}
                    onChange={(e) => setNewActivity({ ...newActivity, withFriend: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded"
                  />
                  <span className="font-bold text-gray-700 text-sm sm:text-base">친구와 함께 운동 (+10% 보너스)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  인증 사진 (선택, 1MB 이하)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-semibold text-xs sm:text-sm"
                />
                {newActivity.photo && (
                  <div className="mt-3 relative">
                    <img src={newActivity.photo} alt="Preview" className="w-full h-40 sm:h-48 object-cover rounded-xl" />
                    <button
                      onClick={() => setNewActivity({ ...newActivity, photo: null })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={addActivity}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 rounded-xl font-black text-base sm:text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                기록 추가하기 🚀
              </button>
            </div>
          </div>
        )}

        {/* Firebase 설정 모달 */}
        {showFirebaseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">🔥 Firebase 설정</h3>
                {isFirebaseConnected && (
                  <button
                    onClick={() => setShowFirebaseModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-bold mb-2">
                    💡 Firebase를 설정하면 친구들과 실시간으로 운동 기록을 공유할 수 있습니다!
                  </p>
                  <p className="text-xs text-gray-600">
                    한 명만 Firebase 프로젝트를 만들고, 설정값을 친구들에게 공유하면 됩니다.
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                    Firebase 설정 JSON 입력
                  </label>
                  <textarea
                    value={firebaseConfigInput}
                    onChange={(e) => setFirebaseConfigInput(e.target.value)}
                    placeholder={`{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "your-project.firebaseapp.com",
  "databaseURL": "https://your-project.firebaseio.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123"
}`}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none font-mono text-xs h-48 sm:h-56"
                  />
                </div>

                <button
                  onClick={saveFirebaseConfig}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  연결하기
                </button>

                <div className="border-t-2 border-gray-200 pt-3 sm:pt-4">
                  <details className="text-xs sm:text-sm text-gray-600">
                    <summary className="font-bold text-gray-800 cursor-pointer mb-2">📚 Firebase 설정 방법 보기</summary>
                    <ol className="list-decimal list-inside space-y-1.5 pl-2 text-xs leading-relaxed">
                      <li><a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a> 접속 후 로그인</li>
                      <li>"프로젝트 추가" 클릭 → 프로젝트 이름 입력</li>
                      <li>Google 애널리틱스 비활성화 (선택)</li>
                      <li>좌측 메뉴 → Realtime Database → 데이터베이스 만들기</li>
                      <li>테스트 모드로 시작 (규칙은 나중에 변경 가능)</li>
                      <li>프로젝트 설정(⚙️) → 일반 → 앱 추가 → 웹(</>) 선택</li>
                      <li>앱 닉네임 입력 → Firebase SDK 추가 코드에서 <code className="bg-gray-100 px-1">firebaseConfig</code> 객체 복사</li>
                      <li>복사한 JSON을 위 입력창에 붙여넣기</li>
                    </ol>
                    <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-xs font-bold text-yellow-800">⚠️ 보안 규칙 설정 (중요!)</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Realtime Database → 규칙 탭에서 다음 규칙 적용:
                      </p>
                      <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded mt-1 overflow-x-auto">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 카카오톡 Key 설정 모달 */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">카카오톡 공유 설정</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    카카오톡 공유 기능을 사용하려면 <strong>카카오 개발자</strong>에서 JavaScript Key를 발급받아야 합니다.
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                    JavaScript Key 입력
                  </label>
                  <input
                    type="text"
                    value={kakaoKey}
                    onChange={(e) => setKakaoKey(e.target.value)}
                    placeholder="JavaScript Key를 입력하세요"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-yellow-400 focus:outline-none font-mono text-xs sm:text-sm"
                  />
                </div>

                <button
                  onClick={() => {
                    if (kakaoKey.trim()) {
                      saveKakaoKey(kakaoKey.trim());
                      setShowShareModal(false);
                    } else {
                      alert('JavaScript Key를 입력해주세요!');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-800 py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  저장하기
                </button>

                <div className="border-t-2 border-gray-200 pt-3 sm:pt-4">
                  <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-2">
                    <p className="font-bold text-gray-800">💡 Key 발급 방법:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li><a href="https://developers.kakao.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">developers.kakao.com</a> 접속 후 로그인</li>
                      <li>내 애플리케이션 → 애플리케이션 추가하기</li>
                      <li>앱 이름 입력 후 생성</li>
                      <li>앱 설정 → 플랫폼 → Web 플랫폼 등록</li>
                      <li>사이트 도메인 입력 (예: https://your-app.vercel.app)</li>
                      <li>앱 키 → JavaScript 키 복사해서 붙여넣기</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="text-center mt-6 sm:mt-8 pb-4 sm:pb-6">
          <p className="text-white/80 text-xs sm:text-sm font-semibold">
            {isFirebaseConnected ? '🔥 Firebase 실시간 동기화 활성!' : '⚠️ Firebase 설정 필요'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FitnessCompetitionApp;
