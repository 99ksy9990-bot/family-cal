COMPONENTS.md 파일 생성.

WWW Family Scheduler 공통 컴포넌트 규칙 문서 작성.

포함 컴포넌트:

# TODAY_ROW
구조:
avatar | name | chip area

규칙:
- 무조건 1줄 rhythm 유지
- OFF도 chip 영역 안
- row height 통일
- chip alignment 고정

# CALENDAR_CARD
규칙:
- 모든 탭 동일 typography
- date size 동일
- dot size 동일
- today tint subtle
- selected outline 제거

# WORK_INPUT
구조:
selected day summary
↓
compact segmented input

규칙:
- D/E/N/OFF만
- giant button 금지
- segmented 느낌

# REQUEST_ROW
구조:
avatar + 이름·날짜
무엇을

규칙:
- task manager 느낌 금지
- TODAY보다 hierarchy 낮게

# REPEAT_ROW
구조:
avatar + 이름 + 반복명
요일 · 시간

규칙:
- 생활 루틴 리스트 느낌
- 사람 section giant card 금지

# BOTTOM_SHEET
규칙:
- compact
- content-fit
- giant modal 금지
- giant empty area 금지

# AVATAR
규칙:
- flat mascot
- low saturation
- pastel
- minimal expression
- overlap 금지

# LEGEND
규칙:
- centered
- 12~13px
- dot 4px
- summary 느낌

출력:
실제 COMPONENTS.md 문서 형식으로 생성.