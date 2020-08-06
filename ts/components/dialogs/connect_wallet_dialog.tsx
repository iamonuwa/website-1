import { DialogContent, DialogOverlay } from '@reach/dialog';
import '@reach/dialog/styles.css';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import {
    NoEthereumProviderError,
    UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from '@web3-react/walletconnect-connector';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { Heading } from 'ts/components/text';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { colors } from 'ts/style/colors';
import { zIndex } from 'ts/style/z_index';
import { utils } from 'ts/utils/utils';

import { useEdgerConnect, useInactiveListener } from 'ts/hooks/use_web3';
import { injected, walletconnect, walletlink } from 'ts/utils/connectors';

enum ConnectorNames {
    Injected = 'Injected',
    WalletConnect = 'WalletConnect',
    WalletLink = 'WalletLink',
}

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
    [ConnectorNames.Injected]: injected,
    [ConnectorNames.WalletConnect]: walletconnect,
    [ConnectorNames.WalletLink]: walletlink,
};

function getErrorMessage(error: Error) {
    if (error instanceof NoEthereumProviderError) {
        return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
    } else if (error instanceof UnsupportedChainIdError) {
        return "You're connected to an unsupported network.";
    } else if (
        error instanceof UserRejectedRequestErrorInjected ||
        error instanceof UserRejectedRequestErrorWalletConnect
    ) {
        return 'Please authorize this website to access your Ethereum account.';
    } else {
        console.error(error);
        return 'An unknown error occurred. Check the console for more details.';
    }
}

const StyledDialogOverlay = styled(DialogOverlay)`
    &[data-reach-dialog-overlay] {
        background-color: rgba(0, 0, 0, 0.75);
        z-index: ${zIndex.overlay};

        @media (max-width: 768px) {
            background: white;
        }
    }
`;

const StyledDialogContent = styled(DialogContent)`
    &[data-reach-dialog-content] {
        width: 571px;
        background: ${(props) => props.theme.bgColor};
        border: 1px solid #e5e5e5;

        @media (max-width: 768px) {
            height: 100vh;
            width: 100vw;
            margin: 0;
            padding: 30px;

            border: none;
        }
    }
`;

const WalletProviderButton = styled(Button).attrs({
    borderColor: '#d9d9d9',
    borderRadius: '0px',
    isTransparent: true,
})`
    height: 70px;
    width: 100%;
    display: flex;
    align-items: center;
    padding: 15px;

    @media (min-width: 769px) {
        & + & {
            margin-left: 30px;
        }
    }

    @media (max-width: 768px) {
        & + & {
            margin-top: 15px;
        }
    }
`;

const ButtonClose = styled(Button)`
    width: 18px;
    height: 18px;
    border: none;

    path {
        fill: ${colors.black};
    }
`;

const ButtonBack = styled(Button)`
    width: 22px;
    height: 17px;
    border: none;

    path {
        fill: ${colors.backgroundDark};
    }
`;

const HeadingRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;

    height: 42px;
    @media (max-width: 768px) {
        height: 38px;
    }

    /* Heading */
    h3 {
        font-size: 34px;

        @media (max-width: 768px) {
            font-size: 28px;
        }
    }
`;

const Divider = styled.div`
    height: 40px;
    border-left: 1px solid #d9d9d9;
    width: 0px;
    margin: 0 15px;
`;

const WalletCategoryStyling = styled.div`
    /* Provider buttons wrapper */
    & > div {
        display: flex;
        flex-direction: row;

        @media (max-width: 768px) {
            flex-direction: column;
        }
    }
`;

interface WalletOptionProps {
    name?: string;
    onClick?: () => void;
    connector?: any;
}
const WalletOption = ({ name, onClick, connector }: WalletOptionProps) => {
    const iconName = utils.getProviderIcon(connector);

    return (
        <WalletCategoryStyling>
            <WalletProviderButton onClick={onClick}>
                {iconName && (
                    <>
                        <Icon name={iconName} size={30} />
                        <Divider />{' '}
                    </>
                )}
                <div style={{ textAlign: 'left' }}>
                    <Heading asElement="h5" size={20} marginBottom="0">
                        {utils.getProviderNameFromConnector(connector)}
                    </Heading>
                </div>
            </WalletProviderButton>
        </WalletCategoryStyling>
    );
};

const IconPlus = styled.div`
    position: relative;
    width: 15px;
    height: 15px;
    margin: auto;

    &:before,
    &:after {
        content: '';
        position: absolute;
        background-color: ${colors.black};
    }

    &:before {
        top: 0;
        left: 7px;
        width: 1px;
        height: 100%;
    }

    &:after {
        top: 7px;
        left: 0;
        width: 100%;
        height: 1px;
    }
`;

const Arrow = () => (
    <svg
        style={{
            transform: 'rotate(180deg)',
        }}
        color={colors.backgroundDark}
        width="22"
        height="17"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M13.066 0l-1.068 1.147 6.232 6.557H0v1.592h18.23l-6.232 6.557L13.066 17l8.08-8.5-8.08-8.5z" />
    </svg>
);

const DashboardUrlWrapper = styled.div`
    height: 70px;
    background: ${colors.backgroundLight};
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: all;
`;

const StyledProviderOptions = styled.div`
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: 1fr 1fr;
    max-width: 30rem;
    margin: auto;
`;

export const ConnectWalletDialog = () => {
    const isOpen = useSelector((state: State) => state.isConnectWalletDialogOpen);
    const { connector, activate, active, error } = useWeb3React();
    const [activatingConnector, setActivatingConnector] = useState<any>();

    useEffect(() => {
        let prevConnector = connector;
        if (activatingConnector && activatingConnector === connector) {
            setActivatingConnector(undefined);
            console.log(prevConnector, connector);
        }
    }, [activatingConnector, connector]);

    const triedEager = useEdgerConnect();

    useInactiveListener(!triedEager || !!activatingConnector);

    const dispatch = useDispatch();
    const [dispatcher, setDispatcher] = useState<Dispatcher | undefined>(undefined);
    useEffect(() => {
        setDispatcher(new Dispatcher(dispatch));
    }, [dispatch]);

    const onCloseDialog = useCallback(() => dispatcher.updateIsConnectWalletDialogOpen(false), [dispatcher]);

    return (
        <StyledDialogOverlay isOpen={isOpen}>
            <StyledDialogContent>
                <HeadingRow>
                    <Heading asElement="h3" marginBottom="0">
                        Connect a wallet
                    </Heading>
                    <ButtonClose isTransparent={true} isNoBorder={true} padding="0px" onClick={onCloseDialog}>
                        <Icon name="close-modal" />
                    </ButtonClose>
                </HeadingRow>
                <StyledProviderOptions>
                    {connectorsByName ? (
                        Object.keys(connectorsByName).map((name, i) => {
                            const currentConnector = connectorsByName[name];
                            const isConnected = currentConnector === connector;
                            const disabled = !triedEager || !!activatingConnector || isConnected || !!error;

                            return (
                                <WalletOption
                                    key={`wallet-button-${i}`}
                                    name={name}
                                    connector={currentConnector}
                                    onClick={() => {
                                        setActivatingConnector(currentConnector);
                                        activate(currentConnector);
                                        onCloseDialog();
                                    }}
                                />
                            );
                        })
                    ) : (
                        <Heading asElement="h5" size={20} marginBottom="0">
                            {!!error && getErrorMessage(error)}
                        </Heading>
                    )}
                </StyledProviderOptions>
            </StyledDialogContent>
        </StyledDialogOverlay>
    );
};
