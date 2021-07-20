from django.shortcuts import render, redirect

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from base.models import Product, Order, OrderItem, ShippingAddress
from base.serializers import ProductSerializer, OrderSerializer

from rest_framework import status
from datetime import datetime

import requests
import json
from django.template import loader
from django.http import HttpResponse, JsonResponse

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def addOrderItems(request):
    user = request.user
    data = request.data

    orderItems = data['orderItems']

    if orderItems and len(orderItems) == 0:
        return Response({'detail': 'No Order Items'}, status=status.HTTP_400_BAD_REQUEST)
    else:

        # (1) Create order

        order = Order.objects.create(
            user=user,
            paymentMethod=data['paymentMethod'],
            taxPrice=data['taxPrice'],
            shippingPrice=data['shippingPrice'],
            totalPrice=data['totalPrice']
        )

        # (2) Create shipping address

        shipping = ShippingAddress.objects.create(
            order=order,
            address=data['shippingAddress']['address'],
            city=data['shippingAddress']['city'],
            postalCode=data['shippingAddress']['postalCode'],
            country=data['shippingAddress']['country'],
        )

        # (3) Create order items adn set order to orderItem relationship
        for i in orderItems:
            product = Product.objects.get(_id=i['product'])

            item = OrderItem.objects.create(
                product=product,
                order=order,
                name=product.name,
                qty=i['qty'],
                price=i['price'],
                image=product.image.url,
            )

            # (4) Update stock

            product.countInStock -= item.qty
            product.save()

        serializer = OrderSerializer(order, many=False)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getMyOrders(request):
    user = request.user
    orders = user.order_set.all()
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def getOrders(request):
    orders = Order.objects.all()
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getOrderById(request, pk):
    user = request.user

    try:
        order = Order.objects.get(_id=pk)
        if user.is_staff or order.user == user:
            serializer = OrderSerializer(order, many=False)
            return Response(serializer.data)
        else:
            Response({'detail':'이 결제내역을 볼 권한이 없습니다'}, 
                    status=HTTP_400_BAD_REQUEST)
    except:
        return Response({'detail':'결제내역이 존재하지 않습니다'},
                    status=HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kakaoPay(request, pk):
    user = request.user
    data = request.data

    URL = 'https://kapi.kakao.com/v1/payment/ready'
    headers = {
        "Authorization": "KakaoAK " + "KAKAOIAPI키",   # 변경불가
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",  # 변경불가
    }
    params = {
        "cid": "TC0ONETIME",    # 테스트용 코드
        "partner_order_id": pk,     # 주문번호
        "partner_user_id": user,    # 유저 아이디
        "item_name": "캠피릿물품",        # 구매 물품 이름
        "quantity": "1",                # 구매 물품 수량
        "total_amount": data['totalPrice'],
        "tax_free_amount": "0",         # 구매 물품 비과세
         # 내 애플리케이션 -> 앱설정 / 플랫폼 - WEB 사이트 도메인에 등록된 정보만 가능합니다
         # 무조건 여기 있는 세놈은 채워줘야함
        "approval_url": "https://campirit.herokuapp.com/#/order/" + str(pk) + "/",
        "cancel_url": "https://campirit.herokuapp.com/#/order/" + str(pk)+ "/",
        "fail_url": "https://campirit.herokuapp.com/#/order/" + str(pk)+ "/",
    }

    res = requests.post(URL, headers=headers, params=params)
    result = res.json()
    request.session['tid'] = result['tid']      # 결제 승인시 사용할 tid를 세션에 저장
    print(result['next_redirect_pc_url'])
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kakaoPay_approval(request, pk, tk):
    user = request.user
    data = request.data

    URL = 'https://kapi.kakao.com/v1/payment/approve'
    headers = {
        "Authorization": "KakaoAK " + "KAKAOIAPI키",
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
    }
    params = {
        "cid": "TC0ONETIME",    # 테스트용 코드
        "tid": request.session['tid'],  # 결제 요청시 세션에 저장한 tid
        "partner_order_id": pk,     # 주문번호
        "partner_user_id": user,    # 유저 아이디
        "pg_token": tk,     # 쿼리 스트링으로 받은 pg토큰
    }

    res = requests.post(URL, headers=headers, params=params)
    result = res.json()
    print(result)
    if result.get('msg'):
        print('FAIL')
        return Response('FAIL')
    else:
        print('SUCCESS')
        order = Order.objects.get(_id=pk)

        order.isPaid = True
        order.paidAt = datetime.now()
        order.save()
        return Response('SUCCESS')

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateOrderToPaid(request, pk):
    order = Order.objects.get(_id=pk)

    order.isPaid = True
    order.paidAt = datetime.now()
    order.save()
    
    return Response('Order was paid')

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateOrderToDelivered(request, pk):
    order = Order.objects.get(_id=pk)

    order.isDelivered = True
    order.deliveredAt = datetime.now()
    order.save()
    
    return Response('Order was delivered')