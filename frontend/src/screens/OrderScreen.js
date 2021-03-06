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
            <h1>????????????: {order._id}</h1>
            <Row>
                <Col md={8}>
                    <ListGroup variant='flush'>
                        <ListGroup.Item>
                            <h2>???????????????</h2>
                            <p><strong>??????: </strong> {order.user.name}</p>
                            <p><strong>?????????: </strong><a href={`mailto:${order.user.email}`}>{order.user.email}</a></p>
                            <p>
                                <strong>???????????????: </strong>
                                {order.shippingAddress.address}, {order.shippingAddress.city}
                                {'  '}
                                {order.shippingAddress.postalCode}, 
                                {'  '}
                                {order.shippingAddress.country}
                            </p>

                            {order.isDelivered ? (
                                <Message variant='success'>????????????{order.deliveredAt}</Message>
                            ) : (
                                <Message variant='warning'>???????????? ??????{order.deliveredAt}</Message>
                            )}
                        </ListGroup.Item>

                        <ListGroup.Item>
                            <h2>????????????</h2>
                            <p>
                                <strong>????????????: </strong>
                                {order.paymentMethod}
                            </p>
                            {order.isPaid ? (
                                <Message variant='success'>????????? {order.paidAt}</Message>
                            ) : (
                                <Message variant='warning'>???????????? ?????? {order.paidAt}</Message>
                            )}
                        </ListGroup.Item>

                        <ListGroup.Item>
                            <h2>????????????</h2>
                            {order.orderItems.length === 0 ? <Message variant='info'>
                                 ?????? ??????????????? ????????????
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
                                                    {item.qty}??? X {item.price}??? = {item.qty * item.price}???
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
                                <h2>????????????</h2>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>????????????:</Col>
                                    <Col>{order.itemsPrice}???</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>?????????:</Col>
                                    <Col>{order.shippingPrice}???</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>????????????:</Col>
                                    <Col>{order.taxPrice}???</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>??? ????????????:</Col>
                                    <Col>{order.totalPrice}???</Col>
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
                                        ?????????????????? ????????????
                                    </Button>

                                    <br></br>
                                    <br></br>

                                    <Button
                                        type='button'
                                        className='btn-block'
                                        onClick={endPay}
                                    >
                                        ????????????
                                    </Button>
                                </ListGroup.Item>
                            ) : (
                                <ListGroupItem>
                                    <h2>????????????</h2>

                                    <Button
                                        type='button'
                                        className='btn-block'
                                        onClick={moveProfile}
                                    >
                                        ???????????? ????????????
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
