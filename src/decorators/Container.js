import React, {Component, PropTypes} from 'react';
import {IntlProvider, injectIntl} from 'react-intl';

export const decorateContainer = function(DecoratedComponent, options = {}) {
    const ConnectedDecoratedComponent = injectIntl(DecoratedComponent);    

    const EnvelopedContainer = class extends Component {
        static get propTypes() {
            return options.propTypes;
        }

        static get contextTypes() {
            return {
                config: PropTypes.object
            };
        }

        createDispatch(props) {
            let {dispatch} = this.props;
            
            if (!dispatch) {
                dispatch = (action) => {
                    if (typeof action === 'function') {
                        action((action) => {
                            // Unwrap all the thunk layers
                            dispatch(action);
                        }, () => {
                            return props;
                        });
                    } else {
                        this.setState(action.payload || {});
                    }
                };
            }

            return dispatch;
        }

        calculateIntlProps() {
            const {messages} = this.props;
            const {locale = options.locale || 'en'} = this.props;

            const props = {locale};

            if (typeof messages !== 'undefined') {
                props.messages = messages;
            }
            
            return props;
        }

        mergeProps() {
            // TODO: Deep merge? Performance on render?
            const contextConfig = this.context ? (this.context.config || {}) : {};
            const propsConfig = this.props ? (this.props.config || {}) : {};
            const stateConfig = this.state ? (this.state.config || {}) : {};
            const config = {...options.config, ...contextConfig, ...propsConfig, ...stateConfig};

            const props = {
                ...this.props,
                ...this.state,
                ...{config: config}
            };

            return props;
        }

        render() {
            const intlProps = this.calculateIntlProps();
            const props = this.mergeProps();
            const dispatch = this.createDispatch(props);

            return (  
                <IntlProvider {...intlProps}>
                    <ConnectedDecoratedComponent {...props} dispatch={dispatch} />
                </IntlProvider>
            );
        }
    };

    Object.defineProperty(EnvelopedContainer, 'name', {writable: true});
    EnvelopedContainer.name = `${DecoratedComponent.name}Container`;
    Object.defineProperty(EnvelopedContainer, 'name', {writable: false});
    EnvelopedContainer.Component = DecoratedComponent;

    return EnvelopedContainer;
};

export default function Container(options = {}) {
    // `options` is the class being decorated
    let result;

    if (typeof options !== 'function') {
        result = (DecoratedComponent) => decorateContainer(DecoratedComponent, options);
    } else {
        result = decorateContainer(options);
    }

    return result;
}

