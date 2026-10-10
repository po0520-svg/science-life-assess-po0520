/* 部位座標依「圖檔／01-複式顯微鏡構造.png」描繪，座標基準 1024 × 1602。 */
window.MicroscopeParts = {
  '目鏡': {path:'M4 53 Q35 -8 87 6 Q109 24 87 64 L176 149 Q177 176 135 188 L22 91 Z',box:[0,0,220,240]},
  '物鏡': {path:'M364 645 L469 645 L469 733 L442 782 L404 783 L373 736 Z M484 634 L569 598 L634 708 L607 754 L567 772 Z',box:[335,590,330,215]},
  '旋轉盤': {path:'M334 585 Q449 637 580 543 L594 580 Q457 689 345 630 Z',box:[300,490,325,195]},
  '鏡筒': {path:'M139 163 L182 136 L383 316 Q403 345 376 373 L338 402 Q316 417 294 388 Z M286 402 Q311 298 397 302 Q532 297 547 429 L547 510 Q514 590 412 597 Q306 592 285 509 Z',box:[130,125,450,495]},
  '載物臺': {path:'M25 823 L327 757 L771 850 L769 930 L343 997 L27 893 Z',box:[0,735,800,290]},
  '玻片夾': {path:'M249 726 L298 751 L325 760 L379 773 L325 792 L274 827 L228 828 L264 791 L300 771 L251 739 Z M511 819 L574 801 L608 820 L673 821 L676 838 L558 860 L512 850 Z',box:[210,705,490,170]},
  '粗調節輪': {path:'M826 883 Q866 884 904 925 Q935 958 930 1017 Q922 1068 866 1078 Q803 1074 767 1014 Q735 967 759 922 Q781 883 826 883 Z',box:[720,850,245,255]},
  '細調節輪': {path:'M911 958 Q957 963 949 1008 Q941 1051 914 1049 Q871 1044 863 1014 Q857 974 886 959 Z',box:[840,935,145,135]},
  '光圈': {path:'M290 982 Q423 1041 548 973 L553 1011 Q499 1080 311 1035 Z M457 913 L516 905 L517 1004 L459 1014 Z',box:[265,890,320,190]},
  '光源': {path:'M328 1180 Q417 1149 486 1181 L514 1228 Q483 1264 366 1253 L319 1232 Z',box:[295,1135,250,160]},
  '光源調整鈕': {path:'M808 1408 L939 1385 L941 1432 L809 1454 Z',box:[770,1340,225,155]},
  '鏡臂': {path:'M546 432 Q748 409 839 548 Q898 662 884 899 L813 897 Q803 715 755 627 Q674 491 552 501 Z M738 1063 L869 1071 L871 1154 L729 1185 Z',box:[535,415,390,790]},
  '鏡座': {path:'M321 1215 L520 1137 L701 1163 L899 1197 L1018 1245 L1021 1404 L970 1466 L397 1589 Q327 1608 238 1555 L89 1485 L70 1403 Q87 1311 321 1215 Z',box:[45,1120,979,482]}
};
window.microscopeFigure = function(name, revealed) {
  const part=window.MicroscopeParts[name];
  const overlay=part&&revealed?`<path class="microscope-highlight" d="${part.path}"/>`:'';
  const picture=`<image href="assets/microscope.png" width="1024" height="1602"/>`;
  return `<figure class="microscope-figure"><h3>複式顯微鏡構造</h3><svg class="microscope-main" viewBox="0 0 1024 1602" role="img" aria-label="${revealed?name+'的位置以金色發亮標示':'複式顯微鏡構造圖；翻牌後標示對應部位'}">${picture}${overlay}</svg><figcaption class="microscope-caption" aria-live="polite">${revealed?`正在觀察：<strong>${name}</strong>`:'先回想位置，再翻牌核對。'}</figcaption>${part&&revealed?`<div class="microscope-detail"><svg viewBox="${part.box.join(' ')}" role="img" aria-label="${name}局部放大圖">${picture}${overlay}</svg><div><strong>${name}</strong><p class="small">局部放大，對照構造與功能。</p></div></div>`:'<p class="small muted">金色標示位置，局部放大協助辨認細節。</p>'}</figure>`;
};
