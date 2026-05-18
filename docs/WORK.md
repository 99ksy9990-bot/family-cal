WORK.md 파일 생성.

WWW Family Scheduler의 근무 탭 전용 UX 규칙 문서 작성.

핵심 역할:
근무 탭 = 근무 상태 입력 전용 화면

포함 내용:

# Work Screen Principle
- 일반 일정 표시 금지
- 수학/영어/학원 표시 금지
- 근무 상태만 관리

# Screen Flow
달력
↓
범례
↓
선택 날짜 summary
↓
compact input

구조 유지.

# Selected Day Summary
예:
5월 18일 월요일

엄마 · E
아빠 · OFF

형태.

# Work Input
[D] [E] [N] [OFF]

segmented control 느낌 유지.

규칙:
- giant button 금지
- compact spacing
- 동일 width 유지

# Legend Rules
예:
● D 9 · ● E 5 · ● N 6 · ● OFF 11

중앙 정렬.

chip 형태 금지.

# Hierarchy
1. calendar
2. selected day
3. 상태
4. input

순서 유지.

# Empty State
근무 등록 없음
→ 생활형 helper text 사용.

# Design Tone
- compact
- lightweight
- 상태보드 느낌
- 관리자툴 금지

출력:
실제 WORK.md 문서 형식으로 생성.