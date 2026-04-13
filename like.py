import requests
import subprocess
import re
import random
import string
import json


# 获取签名
def get_a_bogus(query):
    try:
        result = subprocess.run(
            ['node', 'abogus.js', query],
            capture_output=True,
            text=True,
            encoding='utf-8',
        )
        if result.returncode == 0:
            if result.stdout.strip() != "":
                print("✅ 签名成功")
                return result.stdout.strip()
        else:
            print(f"获取 a_bogus 失败: {result.stderr}")
            return None
    except Exception as e:
        print(f"异常: {e}")
        return None


# 获取roomId
def get_room_id(web_id):
    live_url = f"https://live.douyin.com/{web_id}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0'
    }
    try:
        response = requests.get(live_url, headers=headers, timeout=10)
        response.raise_for_status()
        match = re.findall(r'roomId\\":\\"(.*?)\\",\\"web_rid', response.text)
        if match:
            room_id = match[0]
            print(f"✅ 获取成功！room_id = {room_id}")
            return room_id
        print("❌ 未找到 roomId，请检查直播间是否正在直播")
        return None
    except requests.RequestException as e:
        print(f"❌ 请求失败：{e}")
        return None


# 生成随机msToken
def generate_ms_token(length=107):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def like_live(room_id, count):
    # 这里需要cookie懂不懂
    cookie = ""
    msToken = generate_ms_token()
    params = {
        "aid": "6383",
        "app_name": "douyin_web",
        "live_id": "1",
        "device_platform": "web",
        "language": "zh-CN",
        "enter_from": "web_live",
        "cookie_enabled": "true",
        "screen_width": "1685",
        "screen_height": "948",
        "browser_language": "zh-CN",
        "browser_platform": "Win32",
        "browser_name": "Edge",
        "browser_version": "146.0.0.0",
        "os_name": "Windows",
        "os_version": "10",
        "room_id": room_id,
        "count": count,
        "msToken": msToken,
    }
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    a_bogus = get_a_bogus(query_string)
    if not a_bogus:
        print("签名生成失败")
        return
    params["a_bogus"] = a_bogus
    print(f"params: {params}")
    headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "origin": "https://live.douyin.com",
        "referer": f"https://live.douyin.com/{room_id}",
        "cookie": cookie,
    }
    data = {}
    try:
        res = requests.post("https://live.douyin.com/webcast/room/like/", headers=headers, params=params, data=data)
        resp_json = res.json()
        print(resp_json)
        if resp_json.get("status_code") == 0 and "double_flag" in str(resp_json):
            print("✅ 点赞成功")
    except Exception as e:
        print(f"请求发送失败: {e}")


if __name__ == "__main__":
    # 网页直播间id
    web_id = "972774649689"
    room_id = get_room_id(web_id)
    like_live(room_id, "5")