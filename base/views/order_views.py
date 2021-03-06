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
            Response({'detail':'??? ??????????????? ??? ????????? ????????????'}, 
                    status=HTTP_400_BAD_REQUEST)
    except:
        return Response({'detail':'??????????????? ???????????? ????????????'},
                    status=HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kakaoPay(request, pk):
    user = request.user
    data = request.data

    URL = 'https://kapi.kakao.com/v1/payment/ready'
    headers = {
        "Authorization": "KakaoAK " + "KAKAOIAPI???",   # ????????????
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",  # ????????????
    }
    params = {
        "cid": "TC0ONETIME",    # ???????????? ??????
        "partner_order_id": pk,     # ????????????
        "partner_user_id": user,    # ?????? ?????????
        "item_name": "???????????????",        # ?????? ?????? ??????
        "quantity": "1",                # ?????? ?????? ??????
        "total_amount": data['totalPrice'],
        "tax_free_amount": "0",         # ?????? ?????? ?????????
         # ??? ?????????????????? -> ????????? / ????????? - WEB ????????? ???????????? ????????? ????????? ???????????????
         # ????????? ?????? ?????? ????????? ???????????????
        "approval_url": "https://campirit.herokuapp.com/#/order/" + str(pk) + "/",
        "cancel_url": "https://campirit.herokuapp.com/#/order/" + str(pk)+ "/",
        "fail_url": "https://campirit.herokuapp.com/#/order/" + str(pk)+ "/",
    }

    res = requests.post(URL, headers=headers, params=params)
    result = res.json()
    request.session['tid'] = result['tid']      # ?????? ????????? ????????? tid??? ????????? ??????
    print(result['next_redirect_pc_url'])
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kakaoPay_approval(request, pk, tk):
    user = request.user
    data = request.data

    URL = 'https://kapi.kakao.com/v1/payment/approve'
    headers = {
        "Authorization": "KakaoAK " + "KAKAOIAPI???",
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
    }
    params = {
        "cid": "TC0ONETIME",    # ???????????? ??????
        "tid": request.session['tid'],  # ?????? ????????? ????????? ????????? tid
        "partner_order_id": pk,     # ????????????
        "partner_user_id": user,    # ?????? ?????????
        "pg_token": tk,     # ?????? ??????????????? ?????? pg??????
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