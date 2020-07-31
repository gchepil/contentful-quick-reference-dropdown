import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {Option, Select, ValidationMessage} from '@contentful/forma-36-react-components';
import {init} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
class App extends React.Component {
    static propTypes = {
        sdk: PropTypes.object.isRequired,
    };

    detachExternalChangeHandler = null;

    constructor(props) {
        super(props);
        this.state = {
            value:props.sdk.field.getValue(),
            options:  props.sdk.field.validations,
            isLoading: false,
            errorMessage: '',
        };
    }

    componentDidMount() {
        const {sdk} = this.props;
        sdk.window.startAutoResizer();
        // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
        this.detachExternalChangeHandler = sdk.field.onValueChanged(
            this.onExternalChange
        );
    }

    componentWillUnmount() {
        if (typeof this.detachExternalChangeHandler === "function") {
            this.detachExternalChangeHandler();
        }
    }

    onExternalChange = (externalValue) => {
        const value = externalValue;
        this.setState({value});
    };

    onChange = async (e) => {
        const {sdk} = this.props;

        try {
            const value = e.currentTarget.value;
            this.setState({value, isLoading: true});

            if (value) {
                await sdk.field.setValue(value);
            } else {
                await sdk.field.removeValue();
            }

            this.setState({isLoading: false, errorMessage: null});
        } catch (e) {
            this.setState({isLoading: false, errorMessage: 'Something went wrong'});
        }


    };

    hasError = () => !!this.state.errorMessage;

    render() {
        const {isLoading, options, value, errorMessage} = this.state;

        this.props.sdk.field.setInvalid(this.hasError());

        return (
            <Fragment>
                <Select
                    id="optionSelect"
                    name="optionSelect"
                    hasError={this.hasError()}
                    value={value}
                    onChange={this.onChange}
                    width="auto"
                    isDisabled={isLoading}
                >
                    <Option value="">Choose a value</Option>
                    {this.props.sdk.field.validations.map((option) => (
                        <Option
                            key={option}
                            value={option}
                        >
                            {option}
                        </Option>
                    ))}
                </Select>
                {errorMessage && <ValidationMessage>{errorMessage}</ValidationMessage>}
            </Fragment>
        );
    }
}

init(sdk => {
    ReactDOM.render(<App sdk={sdk}/>, document.getElementById('root'));
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
