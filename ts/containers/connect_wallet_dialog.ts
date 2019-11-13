import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { State } from 'ts/redux/reducer';

import { ConnectWalletDialog as ConnectWalletDialogComponent } from 'ts/components/dialogs/connect_wallet_dialog';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Network, ProviderState } from 'ts/types';

import { asyncDispatcher } from 'ts/redux/async_dispatcher';
import { providerStateFactory } from 'ts/utils/providers/provider_state_factory';

interface ConnectWalletDialogProps {}

interface ConnectedState {
    isOpen: boolean;
    networkId: Network;
    providerState: ProviderState;
}

interface ConnectedDispatch {
    onDismiss: () => void;
    // TODO: is there a nicer way to handle this than passing it back through the component?
    onConnectWallet: (fallbackNetworkId: Network) => void;
}

const mapStateToProps = (state: State, _ownProps: ConnectWalletDialogProps): ConnectedState => ({
    isOpen: state.isConnectWalletDialogOpen,
    networkId: state.networkId,
    providerState: state.providerState,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => {
    const dispatcher = new Dispatcher(dispatch);

    return {
        onDismiss: (): void => {
            dispatcher.updateIsConnectWalletDialogOpen(false);
        },
        onConnectWallet: async (fallbackNetworkId: Network): Promise<void> => {
            try {
                dispatcher.updateIsConnectWalletDialogOpen(false);
                const providerState = providerStateFactory.getInitialProviderState(fallbackNetworkId);

                const networkId = await providerState.web3Wrapper.getNetworkIdAsync();
                if (networkId !== fallbackNetworkId) {
                    dispatcher.updateNetworkId(networkId);
                }

                await asyncDispatcher.fetchAccountInfoAndDispatchToStore(providerState, dispatcher, true);
            } catch (err) {
                // TODO(kimpers): handle errors
            }
        },
    };
};

export const ConnectWalletDialog: React.ComponentClass<ConnectWalletDialogProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ConnectWalletDialogComponent);