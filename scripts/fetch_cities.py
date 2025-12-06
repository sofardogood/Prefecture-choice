#!/usr/bin/env python3
"""
全市区町村の座標データを取得してcities.jsを生成するスクリプト
HeartRails Geo APIを使用
"""

import json
import urllib.request
import urllib.parse
import time
import os

# 都道府県リスト
PREFECTURES = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
    "岐阜県", "静岡県", "愛知県", "三重県",
    "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
    "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県",
    "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
]

def get_cities_for_prefecture(prefecture):
    """都道府県内の市区町村を取得"""
    base_url = "https://geoapi.heartrails.com/api/json"
    params = {
        "method": "getCities",
        "prefecture": prefecture
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
            if 'response' in data and 'location' in data['response']:
                return data['response']['location']
    except Exception as e:
        print(f"Error fetching cities for {prefecture}: {e}")
    return []

def get_city_location(prefecture, city):
    """市区町村の座標を取得"""
    base_url = "https://geoapi.heartrails.com/api/json"
    params = {
        "method": "getTowns",
        "prefecture": prefecture,
        "city": city
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
            if 'response' in data and 'location' in data['response']:
                locations = data['response']['location']
                if locations:
                    # 最初の町丁目の座標を使用（市区町村の代表座標として）
                    loc = locations[0]
                    return {
                        'lat': float(loc['y']),
                        'lng': float(loc['x'])
                    }
    except Exception as e:
        print(f"Error fetching location for {city}, {prefecture}: {e}")
    return None

def main():
    all_cities = {}
    
    print("全市区町村データの取得を開始します...")
    
    for pref in PREFECTURES:
        print(f"\n{pref}の市区町村を取得中...")
        cities = get_cities_for_prefecture(pref)
        
        for city_data in cities:
            city_name = city_data['city']
            print(f"  - {city_name}")
            
            # 座標を取得
            location = get_city_location(pref, city_name)
            time.sleep(0.1)  # API制限対策
            
            if location:
                all_cities[city_name] = {
                    'lat': location['lat'],
                    'lng': location['lng'],
                    'pref': pref
                }
            else:
                # フォールバック：getCitiesの結果から座標を使用（もしあれば）
                if 'y' in city_data and 'x' in city_data:
                    all_cities[city_name] = {
                        'lat': float(city_data['y']),
                        'lng': float(city_data['x']),
                        'pref': pref
                    }
        
        time.sleep(0.5)  # 都道府県間で少し待機
    
    # JavaScriptファイルを生成
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'cities.js')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("// 日本の全市区町村座標データ\n")
        f.write("// データソース: HeartRails Geo API (https://geoapi.heartrails.com/)\n")
        f.write(f"// 総数: {len(all_cities)}件\n")
        f.write("const CITIES = {\n")
        
        # 都道府県ごとにグループ化して出力
        for pref in PREFECTURES:
            pref_cities = {k: v for k, v in all_cities.items() if v['pref'] == pref}
            if pref_cities:
                f.write(f"    // {pref}\n")
                for city_name, data in sorted(pref_cities.items()):
                    f.write(f'    "{city_name}": {{ lat: {data["lat"]}, lng: {data["lng"]}, pref: "{pref}" }},\n')
        
        f.write("};\n")
    
    print(f"\n完了！{len(all_cities)}件の市区町村データを {output_path} に保存しました。")
    
    # JSONでもバックアップ保存
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'cities.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_cities, f, ensure_ascii=False, indent=2)
    print(f"JSONバックアップを {json_path} に保存しました。")

if __name__ == "__main__":
    main()
