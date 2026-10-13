/* Tether 的发布信息。下载页、首页和文档按它填下载链接、版本、日期、文件大小和 SHA-256。
   由 scripts/release.mjs 在 2026-10-12 为 0.5.1 生成，不用手改；格式见那里的 releaseJs()。 */
window.TETHER_RELEASE = {
  "version": "0.5.1",
  "date": "2026-10-12",
  "base": "https://github.com/joyce1998/Tether/releases/download/v0.5.1/",
  "page": "https://github.com/joyce1998/Tether/releases/tag/v0.5.1",
  "platforms": {
    "mac": {
      "beta": false
    },
    "windows": {
      "beta": true
    },
    "linux": {
      "beta": true
    }
  },
  "files": {
    "mac-arm64-dmg": {
      "name": "Tether-0.5.1-mac-arm64.dmg",
      "size": 115740491,
      "sha256": "7d3451cc40f94b216e3df95eb70fcbd1353c2f024d7e659247a0f449f512011b"
    },
    "mac-x64-dmg": {
      "name": "Tether-0.5.1-mac-x64.dmg",
      "size": 124007227,
      "sha256": "37c13fd554b4119e5ff22ff1c5f8e95c02e5668255f848f3f6915430b8eb6282"
    },
    "mac-arm64-zip": {
      "name": "Tether-0.5.1-mac-arm64.zip",
      "size": 115751482,
      "sha256": "5d4911eba88565024be39fa67a8ece5c29fb460dab8aff866a4e10cf8c0a2e6f"
    },
    "mac-x64-zip": {
      "name": "Tether-0.5.1-mac-x64.zip",
      "size": 124050373,
      "sha256": "ca481c296957dbf64c97aa6a8eb1004332838334d003ebc4dcc0af17e30eb897"
    },
    "win-x64-nsis": {
      "name": "Tether-0.5.1-win-x64-setup.exe",
      "size": 99933815,
      "sha256": "2bd4c2be617cf6555749108aaf0724b9fc0dfc4fc8c5460a2e43788937f48380"
    },
    "win-arm64-nsis": {
      "name": "Tether-0.5.1-win-arm64-setup.exe",
      "size": 94882040,
      "sha256": "a33f8705b1036a528925914d3c1ce4cda8946ae2a39614ec5e94c60c957abf68"
    },
    "linux-x64-appimage": {
      "name": "Tether-0.5.1-linux-x86_64.AppImage",
      "size": 112223605,
      "sha256": "4caef0b2570ce5fdbdd549afacd6f716884365fbe070e58dacbdd00888fd5792"
    },
    "linux-arm64-appimage": {
      "name": "Tether-0.5.1-linux-arm64.AppImage",
      "size": 111655356,
      "sha256": "b97d482afaa7d3a58adb450fa3b23bbf987454729aafc825f2cd2c495ee87f66"
    },
    "linux-x64-deb": {
      "name": "Tether-0.5.1-linux-amd64.deb",
      "size": 95620544,
      "sha256": "ea3e7759b0205fed482a35d4416c2d8eb5052dcf82a9e299ecd6245af90819b4"
    },
    "linux-arm64-deb": {
      "name": "Tether-0.5.1-linux-arm64.deb",
      "size": 90205940,
      "sha256": "2f0d22998a083c3236db29707ac62b451daaee5d9d60eb0d5aebd8fb1ea7512d"
    }
  }
};
