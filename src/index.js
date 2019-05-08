import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {Option, Select, ValidationMessage} from '@contentful/forma-36-react-components';
import {init} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

const unwrapLinkId = (link) => (link && link.sys && link.sys.id) ? link.sys.id : undefined;

const wrapLinkId = (id) => ({
    sys: {
        id,
        linkType: "Entry",
        type: "Link"
    }
});

class App extends React.Component {
    static propTypes = {
        sdk: PropTypes.object.isRequired,
    };

    detachExternalChangeHandler = null;

    constructor(props) {
        super(props);
        this.state = {
            value: unwrapLinkId(props.sdk.field.getValue()),
            options: [],
            isLoading: true,
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
        this.loadOptions();
    }

    componentWillUnmount() {
        if (typeof this.detachExternalChangeHandler === "function") {
            this.detachExternalChangeHandler();
        }
    }

    onExternalChange = (externalValue) => {
        const value = unwrapLinkId(externalValue);
        this.setState({value});
    };

    onChange = async (e) => {
        const {sdk} = this.props;

        try {
            const value = e.currentTarget.value;
            this.setState({value, isLoading: true});

            if (value) {
                await sdk.field.setValue(wrapLinkId(value));
            } else {
                await sdk.field.removeValue();
            }

            this.setState({isLoading: false, errorMessage: null});
        } catch (e) {
            this.setState({isLoading: false, errorMessage: 'Something went wrong'});
        }


    };

    getAllowedContentTypes = () =>
        this.props.sdk.field.validations.reduce(
            (acc, {linkContentType}) => linkContentType ? [...acc, ...linkContentType] : acc,
            []
        );


    loadOptions = async () => {
        try {
            this.setState({isLoading: true});
            const resp = await this.props.sdk.space.getEntries({content_type: this.getAllowedContentTypes()});
            const locale = this.props.sdk.field.locale;
            const options = resp.items.reduce((acc, i) => [...acc, {
                value: i.sys.id,
                label: i.fields.name[locale]
            }], []);
            this.setState({options, isLoading: false, errorMessage: null});
        } catch (error) {
            console.error(error);
            this.setState({isLoading: false, errorMessage: 'Couldn\'t load options, please reload'})
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
                    {options.map(({value, label}) => (
                        <Option
                            key={value}
                            value={value}
                        >
                            {label}
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
