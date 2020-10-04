/* tslint:disable */
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Icon } from 'ts/components/icon';
import { SimulatorNumberInput } from 'ts/components/inputs/number_input';
import { StakingSimulatorDropdown } from 'ts/components/inputs/select_input';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { PoolWithStats } from 'ts/types';
import { useAPIClient } from 'ts/hooks/use_api_client';
import { stakingUtils } from 'ts/utils/staking_utils';

const transforms: any = {
    top: 'translateY(-100%)',
    right: 'translateX(100%)', // PC
    bottom: 'translateY(100%)', // Mobile
    left: 'translateX(-100%)',
};

const SimulatorDrawerWrapper: any = styled.div`
    display: block;
    width: ${(props: SimulatorDrawerProps) => (props.size ? props.size : '300px')};
    height: 100%;
    transform: ${(props: SimulatorDrawerProps) => (!props.open ? transforms.right : null)};
`;

// Covers entire view and is used for dismissal
const SimulatorDrawerOverlay: any = styled.div`
    position: fixed;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    z-index: 8;
    display: ${(props: SimulatorDrawerProps) => (props.open ? null : 'none')};
`;

const SimulatorDrawerContent: any = styled.div`
    display: block;
    box-sizing: border-box;
    position: fixed;
    right: ${(props: SimulatorDrawerProps) => (props.size ? props.size : '400px')};
    top: 0;
    height: 100%;
    z-index: 16;
    width: ${(props: SimulatorDrawerProps) => (props.size ? props.size : '300px')};
    transform: ${(props: SimulatorDrawerProps) => (!props.open ? transforms.right : null)};
    transition: transform 0.2s ease-out;
    overflow-x: hidden;
    overflow-y: auto;
    color: #000;
    background-color: ${(props: SimulatorDrawerProps) => props.backgroundColor || '#fff'};
    box-shadow: -10px 0px 10px rgba(0, 0, 0, 0.19);
    transition: visibility 0s, transform 0.5s;
`;

const Body = styled.div`
    padding: 39px 30px 39px 30px;
`;

const Heading = styled.div`
    display: flex;
    justify-content: space-between;
`;

const HeadingText = styled.h1`
    font-size: 28px;
    line-height: 38px;
`;

const StyledButtonClose = styled.button.attrs({
    type: 'button',
})`
    cursor: pointer;
    position: absolute;
    right: 20px;
    top: 70px;
    overflow: hidden;
    width: 15px;
    height: 15px;
    border: 0;
    background-color: transparent;
    padding: 0;
    transform: translateY(-47px);

    span {
        opacity: 0;
        visibility: hidden;
        position: absolute;
    }

    path {
        fill: ${props => props.theme.textColor};
    }
`;

const Content = styled.div``;

const ExpansibleCTA = styled.div`
    text-align: center;
    cursor: pointer;
    font-size: 16px;
    line-height: 20px;
    margin-bottom: 34px;
`;

const DetailWrapper = styled.div`
    margin-bottom: 52px;
`;

const DetailHeading = styled.h1`
    font-size: 20px;
    line-height: 27px;
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed #d9d9d9;
    padding: 15px 0;
`;

const DetailRowText = styled.span`
    font-size: 17px;
    line-height: 21px;
    color: #898990;
`;

const Arrow = styled.svg`
    fill: #000000;
    transition: transform 0.25s ease-in-out;
`;

const Footer = styled.span`
    font-size: 13px;
    color: #898990;
    text-align: center;
`;

interface SimulatorDrawerProps {
    open?: boolean;
    size?: string | number;
    dispatcher: Dispatcher;
    onDismiss?: () => void;
    backgroundColor?: string;
    data?: any;
}

export const SimulatorDrawer = ({ open, size, onDismiss, backgroundColor, data, dispatcher }: SimulatorDrawerProps) => {
    const isOpen = useSelector((state: State) => state.isSimulationDialogOpen);
    const activePool = useSelector((state: State) => state.activePool);
    const networkId = useSelector((state: State) => state.networkId);
    const apiClient = useAPIClient(networkId);
    const [state, setState] = React.useState<boolean>(false);
    const [selectedOption, setSelectedOption] = React.useState(undefined);
    const [stakingPools, setStakingPools] = React.useState<PoolWithStats[] | undefined>(undefined);

    // useWindowEvent('click', nodeRef, (e: React.SyntheticEvent<EventTarget>) => {
    //     console.log('Outside');
    //     if (nodeRef?.current?.contains(e.target as HTMLInputElement)) {
    //         console.log('Inside');
    //         return;
    //     }
    //     toggleSimulatorDrawer(false);
    // });

    React.useEffect(() => {
        const fetchAndSetPoolsAsync = async () => {
            const poolsResponse = await apiClient.getStakingPoolsAsync();
            const activePools = (poolsResponse.stakingPools || [])
                .filter(stakingUtils.isPoolActive)
                .filter(pool => pool.metaData.name); // most of the active pools don't have an image, name
            setStakingPools(activePools);
        };
        // tslint:disable-next-line:no-floating-promises
        fetchAndSetPoolsAsync();
        updateActivePool(data);
        setActive();
    }, [apiClient]);

    const updateActivePool = useCallback(
        async (data: PoolWithStats) => {
            dispatcher.updateActivePool(data);
        },
        [dispatcher],
    );

    const onSelected = (data: any) => {
        const selectedPool = stakingPools.find((pool: PoolWithStats) => pool.poolId === data.value);
        setSelectedOption(data);
        updateActivePool(selectedPool);
    };

    const onReset = () => {
        setActive();
        updateActivePool(data);
    };

    const setActive = () => {
        setSelectedOption({
            label: data.metaData.name,
            value: data.poolId,
            image: data.metaData.logoUrl,
        });
    };

    const calculateStake = (e: any) => {
        const stake = e.target.value;

        console.log(stake);
    };

    return (
        <React.Fragment>
            {isOpen && (
                <SimulatorDrawerWrapper open={isOpen} size={size}>
                    <SimulatorDrawerOverlay open={open} onClick={onDismiss} />
                    <SimulatorDrawerContent open={open} size={size} backgroundColor={backgroundColor}>
                        <Body>
                            <Heading>
                                <HeadingText>Reward Simulator</HeadingText>
                                <StyledButtonClose onClick={onDismiss}>
                                    <Icon name="close-modal" size={15} margin={[0, 0, 0, 0]} />
                                </StyledButtonClose>
                            </Heading>
                            <Content>
                                <StakingSimulatorDropdown
                                    labelText="Staking Pool"
                                    onSelected={data => onSelected(data)}
                                    selected={selectedOption}
                                    onReset={() => onReset()}
                                    options={stakingPools}
                                />
                                <SimulatorNumberInput
                                    heading="Your Stake"
                                    subText={`Balance: ${activePool.currentEpochStats.totalProtocolFeesGeneratedInEth} ZRX`}
                                    name="stake"
                                    onChange={e => calculateStake(e)}
                                    token="ZRX"
                                />
                                <SimulatorNumberInput
                                    heading="Fees Generated by Pool"
                                    name="feesByPool"
                                    onChange={() => {}}
                                    value={activePool.currentEpochStats.totalProtocolFeesGeneratedInEth}
                                    token="ETH"
                                />
                                {state && (
                                    <React.Fragment>
                                        <SimulatorNumberInput
                                            heading="Fees Generated by All Pools"
                                            name="feesByAllPools"
                                            onChange={() => {}}
                                            token="ETH"
                                        />
                                        <SimulatorNumberInput
                                            heading="ZRX Staked in Pool"
                                            name="stakedZRX"
                                            token="ZRX"
                                            value={activePool.currentEpochStats.zrxStaked}
                                        />
                                        <SimulatorNumberInput
                                            heading="ZRX Staked in All Pools"
                                            name="allStakedZRX"
                                            token="ZRX"
                                        />
                                        <SimulatorNumberInput
                                            heading="% Rewards Shared"
                                            name="rewardsShared"
                                            token="%"
                                        />
                                    </React.Fragment>
                                )}

                                <ExpansibleCTA onClick={() => setState(!state)}>
                                    {state ? 'See Less' : 'More Settings'}
                                    {state ? (
                                        <Arrow
                                            color="#000000"
                                            width="22"
                                            height="17"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M0 0h24v24H0z" fill="none" />
                                            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                                        </Arrow>
                                    ) : (
                                        <Arrow
                                            color="#000000"
                                            width="22"
                                            height="17"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M0 0h24v24H0V0z" fill="none" />
                                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                                        </Arrow>
                                    )}
                                </ExpansibleCTA>

                                <DetailWrapper>
                                    <DetailHeading>Estimated Rewards this Epoch:</DetailHeading>
                                    <DetailRow>
                                        <DetailRowText>Pool Reward</DetailRowText>
                                        <DetailRowText></DetailRowText>
                                    </DetailRow>
                                    <DetailRow>
                                        <DetailRowText>Stakers Reward (5%)</DetailRowText>
                                        <DetailRowText>{1 - activePool.currentEpochStats.operatorShare}</DetailRowText>
                                    </DetailRow>
                                    <DetailRow>
                                        <DetailRowText>Your Reward</DetailRowText>
                                        <DetailRowText></DetailRowText>
                                    </DetailRow>
                                </DetailWrapper>

                                <Footer>Read our FAQ for more details on reward calculation</Footer>
                            </Content>
                        </Body>
                    </SimulatorDrawerContent>
                </SimulatorDrawerWrapper>
            )}
        </React.Fragment>
    );
};
