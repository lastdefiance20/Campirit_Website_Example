import React from 'react'
import { Nav } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

function CheckoutSteps({step1, step2, step3, step4}) {
    return (
        <Nav className='justify-content-center mb-4'>

            <Nav.Item>
                {step1 ? (
                    <LinkContainer to='/login'>
                        <Nav.Link>로그인</Nav.Link>
                    </LinkContainer>
                ) : (
                    <Nav.Link disabled>로그인</Nav.Link>
                )}
            </Nav.Item>

            <Nav.Item>
                {step2 ? (
                    <LinkContainer to='/shipping'>
                        <Nav.Link>주소입력</Nav.Link>
                    </LinkContainer>
                ) : (
                    <Nav.Link disabled>주소입력</Nav.Link>
                )}
            </Nav.Item>

            <Nav.Item>
                {step3 ? (
                    <LinkContainer to='/payment'>
                        <Nav.Link>결제방법 선택</Nav.Link>
                    </LinkContainer>
                ) : (
                    <Nav.Link disabled>결제방법 선택</Nav.Link>
                )}
            </Nav.Item>

            <Nav.Item>
                {step4 ? (
                    <LinkContainer to='/placeorder'>
                        <Nav.Link>결제 및 결제완료</Nav.Link>
                    </LinkContainer>
                ) : (
                    <Nav.Link disabled>결제 및 결제완료</Nav.Link>
                )}
            </Nav.Item>
        </Nav>
    )
}

export default CheckoutSteps
