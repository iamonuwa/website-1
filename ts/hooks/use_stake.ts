import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { StakingContract, StakingProxyContract } from '@0x/contract-wrappers';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { State } from 'ts/redux/reducer';
import { AccountReady, StakeStatus, StakingPoolRecomendation, TransactionLoadingState } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

export const useStake = () => {
    const networkId = useSelector((state: State) => state.networkId);
    const providerState = useSelector((state: State) => state.providerState);

    const [loadingState, setLoadingState] = React.useState<undefined | TransactionLoadingState>(undefined);
    const [error, setError] = React.useState<Error | undefined>(undefined);
    const [result, setResult] = React.useState<TransactionReceiptWithDecodedLogs | undefined>(undefined);
    const [estimatedTimeMs, setEstimatedTimeMs] = React.useState<number | undefined>(undefined);

    const depositAndStake = async (stakePoolData: StakingPoolRecomendation[]) => {
        if (!stakePoolData || stakePoolData.length === 0) {
            return;
        }

        if (
            [TransactionLoadingState.WaitingForTransaction, TransactionLoadingState.WaitingForSignature].includes(
                loadingState,
            )
        ) {
            return;
        }

        setLoadingState(TransactionLoadingState.WaitingForSignature);

        const normalizedPoolData = stakePoolData.map(stakingPoolReccomendation => ({
            poolId: utils.toPaddedHex(stakingPoolReccomendation.pool.poolId),
            amountBaseUnits: Web3Wrapper.toBaseUnitAmount(
                new BigNumber(stakingPoolReccomendation.zrxAmount, 10),
                constants.DECIMAL_PLACES_ZRX,
            ),
        }));

        const totalStakeBaseUnits = normalizedPoolData.reduce(
            (memo: BigNumber, { amountBaseUnits }: { amountBaseUnits: BigNumber }) => {
                return memo.plus(amountBaseUnits);
            },
            new BigNumber(0, 10),
        );

        const ownerAddress = (providerState.account as AccountReady).address;
        const contractAddresses = getContractAddressesForChainOrThrow(networkId);

        const stakingContract = new StakingContract(contractAddresses.stakingProxy, providerState.provider, {
            from: ownerAddress,
        });
        const stakingProxyContract = new StakingProxyContract(contractAddresses.stakingProxy, providerState.provider, {
            from: ownerAddress,
        });

        const gasInfo = await backendClient.getGasInfoAsync();

        const data = [
            stakingContract.stake(totalStakeBaseUnits).getABIEncodedTransactionData(),
            ...normalizedPoolData.map(({ poolId, amountBaseUnits }) =>
                stakingContract
                    .moveStake(
                        { status: StakeStatus.Undelegated, poolId: constants.STAKING.NIL_POOL_ID }, // From undelegated
                        { status: StakeStatus.Delegated, poolId }, // To the pool
                        amountBaseUnits,
                    )
                    .getABIEncodedTransactionData(),
            ),
        ];

        const txPromise = stakingProxyContract
            .batchExecute(data)
            .awaitTransactionSuccessAsync({ from: ownerAddress, gasPrice: gasInfo.gasPriceInWei });

        await txPromise.txHashPromise;
        setEstimatedTimeMs(gasInfo.estimatedTimeMs);
        setLoadingState(TransactionLoadingState.WaitingForTransaction);
        // tslint:disable:await-promise
        const txResult = await txPromise;
        setResult(txResult);
        setLoadingState(TransactionLoadingState.Success);
    };

    return {
        loadingState,
        result,
        error,
        depositAndStake: (stakePoolData: StakingPoolRecomendation[]) => {
            depositAndStake(stakePoolData).catch((err: Error) => {
                setLoadingState(TransactionLoadingState.Failed);
                setError(err);
                logUtils.log(err);
            });
        },
        estimatedTimeMs,
    };
};
