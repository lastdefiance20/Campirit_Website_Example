import React, {useState, useEffect} from 'react'
import { Button, Row, Col, ListGroup, Image, Card, Form, ListGroupItem } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { getOrderDetails, payOrder, kakaoPayOrder, kakaoPayCheckOrder, deliverOrder } from '../actions/orderActions'
import FormContainer from '../components/FormContainer'
import { KAKAO_PAY_RESET, KAKAO_PAY_CHECK_RESET, ORDER_DELIVER_RESET } from '../constants/orderConstants'

function OrderScreen({match, history}) {
    const orderId = match.params.id
    const dispatch = useDispatch()
    const url = window.location.href
    const pgtoken = url.split('pg_token=')[1]

    console.log(pgtoken)

    const orderDetails = useSelector(state => state.orderDetails)
    const {order, error, loading} = orderDetails

    const orderCheckKakaoPay = useSelector(state => state.orderCheckKakaoPay)
    const {loading:loadingtoPay, success:successtoPay} = orderCheckKakaoPay

    const orderDeliver = useSelector(state => state.orderDeliver)
    const {loading:loadingDeliver, success:successDeliver} = orderDeliver

    const userLogin = useSelector(state => state.userLogin)
    const {userInfo} = userLogin


    if(!loading && !error){
        order.itemsPrice = order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    }

    const successPay = () => {
        dispatch(kakaoPayOrder(orderId, order))
    }

    const endPay = () => {
        dispatch(kakaoPayCheckOrder(orderId, order, pgtoken))
    }

    const moveProfile = () => {
        history.push('/profile')
    }

    useEffect(() => {
        if(!userInfo){
            history.push('/login')
        }

        if(!order || successtoPay || order._id !== Number(orderId) || successDeliver){
            dispatch({type:ORDER_DELIVER_RESET})
            dispatch({type:KAKAO_PAY_RESET})
            dispatch({type:KAKAO_PAY_CHECK_RESET})

            dispatch(getOrderDetails(orderId))
        }
    }, [dispatch, order, orderId, successtoPay, successDeliver])

    const deliverHandler = () =>{
        dispatch(deliverOrder(order))
    }
    
    return loading ? (
        <Loader/>
    ) : error ? (
        <Message variant='danger'>{error}</Message>
    ) : (
        <div>
            <h1>주문번호: {order._id}</h1>
            <Row>
                <Col md={8}>
                    <ListGroup variant='flush'>
                        <ListGroup.Item>
                            <h2>주문자정보</h2>
                            <p><strong>이름: </strong> {order.user.name}</p>
                            <p><strong>이메일: </strong><a href={`mailto:${order.user.email}`}>{order.user.email}</a></p>
                            <p>
                                <strong>배송지정보: </strong>
                                {order.shippingAddress.address}, {order.shippingAddress.city}
                                {'  '}
                                {order.shippingAddress.postalCode}, 
                                {'  '}
                                {order.shippingAddress.country}
                            </p>

                            {order.isDelivered ? (
                                <Message variant='success'>배송완료{order.deliveredAt}</Message>
                            ) : (
                                <Message variant='warning'>배송되지 않음{order.deliveredAt}</Message>
                            )}
                        </ListGroup.Item>

                        <ListGroup.Item>
                            <h2>결제수단</h2>
                            <p>
                                <strong>결제수단: </strong>
                                {order.paymentMethod}
                            </p>
                            {order.isPaid ? (
                                <Message variant='success'>결제됨 {order.paidAt}</Message>
                            ) : (
                                <Message variant='warning'>결제되지 않음 {order.paidAt}</Message>
                            )}
                        </ListGroup.Item>

                        <ListGroup.Item>
                            <h2>주문내역</h2>
                            {order.orderItems.length === 0 ? <Message variant='info'>
                                 상품 주문내역이 없습니다
                            </Message> : (
                                <ListGroup variant='flush'>
                                    {order.orderItems.map((item, index) => (
                                        <ListGroup.Item key={index}>
                                            <Row>
                                                <Col md={1}>
                                                    <Image src={item.image} alt={item.name} fluid rounded/>
                                                </Col>

                                                <Col>
                                                    <Link to={`/product/${item.product}`}>{item.name}</Link>
                                                </Col>

                                                <Col md={4}>
                                                    {item.qty}개 X {item.price}원 = {item.qty * item.price}원
                                                </Col>
                                            </Row>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </ListGroup.Item>
                    </ListGroup>
                </Col>

                <Col md={4}>
                    <Card>
                        <ListGroup variant='flush'>
                            <ListGroup.Item>
                                <h2>결제상세</h2>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>상품금액:</Col>
                                    <Col>{order.itemsPrice}원</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>배송비:</Col>
                                    <Col>{order.shippingPrice}원</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>할인금액:</Col>
                                    <Col>{order.taxPrice}원</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>총 주문금액:</Col>
                                    <Col>{order.totalPrice}원</Col>
                                </Row>
                            </ListGroup.Item>
                            
                            {!order.isPaid ? (
                                <ListGroup.Item>
                                    {loadingtoPay && <Loader/>}

                                    <Button
                                        type='button'
                                        className='btn-block'
                                        onClick={successPay}
                                        variant="outline-warning"
                                    >
                                        카카오페이로 결제하기
                                    </Button>

                                    <br></br>
                                    <br></br>

                                    <Button
                                        type='button'
                                        className='btn-block'
                                        onClick={endPay}
                                    >
                                        결제확정
                                    </Button>
                                </ListGroup.Item>
                            ) : (
                                <ListGroupItem>
                                    <h2>결제완료</h2>

                                    <Button
                                        type='button'
                                        className='btn-block'
                                        onClick={moveProfile}
                                    >
                                        주문내역 확인하기
                                    </Button>
                                </ListGroupItem>
                            )}
                        </ListGroup>
                        {loadingDeliver && <Loader />}
                        {userInfo && userInfo.isAdmin && order.isPaid && !order.isDelivered && (
                            <ListGroup.Item>
                                <Button
                                    type='button'
                                    className='btn btn-block'
                                    onClick={deliverHandler}
                                >
                                    Mark As Deliver
                                </Button>
                            </ListGroup.Item>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default OrderScreen
