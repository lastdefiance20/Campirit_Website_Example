# Campirit-Website, 창업경진대회용 웹사이트
![campirit](https://user-images.githubusercontent.com/65525866/126346191-657cb695-0326-4aa7-9f3b-beb61bca70a4.png)

## 지원 목록
>웹사이트 로그인/로그아웃

>장바구니 기능

>카카오페이 TEST 구매 기능

>등등 웹사이트의 모든 것을 지원함

>(쇼핑부터 카카오페이 결제까지)

>Admin은 배송하고 배송 완료 status도 표시 가능

## 웹사이트

- Heroku와 아마존 S3, RWS를 이용하여 구현함
https://campirit.herokuapp.com/#/

## WorkFlow
전체적인 구조
![workflow](https://user-images.githubusercontent.com/65525866/126345987-95750699-efb5-4430-ac33-4bdc3b11dba9.png)

## Demo 방법
> 키와 토큰은 모두 가려져 있습니다.

> 가상 서버를 열고, requirements를 모두 설치해 줍니다.

> Django의 Setting에 키를 넣고, order_views에 키를 넣어줘야 합니다.

> Frontend와 backend를 변경한 후, frontend 폴더로 들어가 npm run build를 한 뒤, 밖으로 나와 python manage.py collectstatic으로 배포 준비를 마칩니다.

> 따로 서버를 여는 방법은 장고는 python manage.py runserver, 리액트는 cd frontend로 frontend 폴더로 들어간 후 npm start를 해주면 됩니다
