// 運命の旅先 - メインアプリケーション
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素
    const cityInput = document.getElementById('cityInput');
    const suggestions = document.getElementById('suggestions');
    const destinyButton = document.getElementById('destinyButton');
    const inputSection = document.getElementById('inputSection');
    const resultSection = document.getElementById('resultSection');
    const prefectureName = document.getElementById('prefectureName');
    const distanceNumber = document.getElementById('distanceNumber');
    const distanceMessage = document.getElementById('distanceMessage');
    const spotsList = document.getElementById('spotsList');
    const adviceContent = document.getElementById('adviceContent');
    const encouragementText = document.getElementById('encouragementText');
    const retryButton = document.getElementById('retryButton');

    let selectedCity = null;

    // ==========================================
    // サジェスト機能
    // ==========================================
    cityInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length < 1) {
            suggestions.classList.remove('active');
            return;
        }

        const matches = Object.keys(CITIES)
            .filter(city => city.includes(query))
            .slice(0, 8);

        if (matches.length === 0) {
            suggestions.classList.remove('active');
            return;
        }

        suggestions.innerHTML = matches.map(city => `
            <div class="suggestion-item" data-city="${city}">
                <span class="city-name">${city}</span>
                <span class="prefecture-name">${CITIES[city].pref}</span>
            </div>
        `).join('');

        suggestions.classList.add('active');
    });

    // サジェストアイテムクリック
    suggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (item) {
            const city = item.dataset.city;
            cityInput.value = city;
            selectedCity = city;
            suggestions.classList.remove('active');
        }
    });

    // 外部クリックでサジェストを閉じる
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-wrapper')) {
            suggestions.classList.remove('active');
        }
    });

    // ==========================================
    // 距離計算（ハヴァサイン公式）
    // ==========================================
    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 地球の半径（km）
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }

    // ==========================================
    // 運命ボタンクリック
    // ==========================================
    destinyButton.addEventListener('click', () => {
        const inputValue = cityInput.value.trim();

        // 入力チェック
        if (!inputValue) {
            alert('お住まいの市区町村を入力してください');
            return;
        }

        // 入力された都市を検索
        let userCity = null;
        if (CITIES[inputValue]) {
            userCity = CITIES[inputValue];
        } else {
            // 部分一致で検索
            const match = Object.keys(CITIES).find(city => city.includes(inputValue) || inputValue.includes(city));
            if (match) {
                userCity = CITIES[match];
            }
        }

        if (!userCity) {
            alert('申し訳ございません。入力された市区町村が見つかりませんでした。\n別の市区町村名をお試しください。');
            return;
        }

        // ランダムに都道府県を選択（ユーザーの都道府県は除く）
        const availablePrefectures = PREFECTURES.filter(p => p.name !== userCity.pref);
        const selectedPrefecture = availablePrefectures[Math.floor(Math.random() * availablePrefectures.length)];

        // 距離を計算
        const distance = calculateDistance(
            userCity.lat, userCity.lng,
            selectedPrefecture.lat, selectedPrefecture.lng
        );

        // 結果を表示
        showResult(selectedPrefecture, distance);
    });

    // ==========================================
    // 結果表示
    // ==========================================
    function showResult(prefecture, distance) {
        // 都道府県名
        prefectureName.textContent = prefecture.name;

        // 距離
        distanceNumber.textContent = distance.toLocaleString();
        distanceMessage.textContent = getDistanceMessage(distance);

        // 観光地リスト（ランダムで5つ選択）
        const shuffledSpots = [...prefecture.spots].sort(() => Math.random() - 0.5);
        const selectedSpots = shuffledSpots.slice(0, 5);
        spotsList.innerHTML = selectedSpots.map(spot => `
            <div class="spot-item">
                <h4 class="spot-name">${spot.name}</h4>
                <p class="spot-description">${spot.description}</p>
                <span class="spot-highlight">✦ ${spot.highlight}</span>
            </div>
        `).join('');

        // 旅行アドバイス
        const advice = getTravelAdvice(distance);
        adviceContent.innerHTML = `
            <div class="advice-section">
                <h4 class="advice-section-title">おすすめの旅程</h4>
                <p>${advice.duration}がおすすめです。</p>
            </div>
            <div class="advice-section">
                <h4 class="advice-section-title">移動手段</h4>
                <ul class="advice-list">
                    ${advice.transport.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
            <div class="advice-section">
                <h4 class="advice-section-title">持ち物リスト</h4>
                <ul class="advice-list">
                    ${advice.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <div class="advice-section">
                <h4 class="advice-section-title">ワンポイントアドバイス</h4>
                <p>${advice.tips}</p>
            </div>
        `;

        // 励ましメッセージ
        const randomMessage = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        encouragementText.innerHTML = randomMessage.replace(/\n/g, '<br>');

        // セクションの表示切り替え
        resultSection.classList.remove('hidden');

        // 結果セクションまでスクロール
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // 距離に応じたメッセージ
    function getDistanceMessage(distance) {
        if (distance < 100) {
            return '意外と近い！日帰りで行けそうですね';
        } else if (distance < 300) {
            return '1泊2日でゆっくり楽しめる距離です';
        } else if (distance < 500) {
            return '少し遠いですが、その分新しい発見がありそうです';
        } else {
            return '日本の広さを感じる距離ですね。だからこそ価値がある旅に';
        }
    }

    // 距離に応じた旅行アドバイス
    function getTravelAdvice(distance) {
        if (distance < 100) {
            return TRAVEL_ADVICE.short;
        } else if (distance < 300) {
            return TRAVEL_ADVICE.medium;
        } else if (distance < 500) {
            return TRAVEL_ADVICE.long;
        } else {
            return TRAVEL_ADVICE.veryLong;
        }
    }

    // ==========================================
    // もう一度ボタン
    // ==========================================
    retryButton.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        setTimeout(() => {
            inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    });
});
