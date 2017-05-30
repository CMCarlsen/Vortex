import { showDialog } from '../../../actions/notifications';
import { ComponentEx, connect, translate } from '../../../util/ComponentEx';
import { getSafe } from '../../../util/storeHelper';
import FormFeedbackAwesome from '../../../views/FormFeedbackAwesome';
import { Button } from '../../../views/TooltipControls';

import { setUserAPIKey } from '../actions/account';
import { IValidateKeyData } from '../types/IValidateKeyData';

import * as update from 'immutability-helper';
import * as React from 'react';
import { ControlLabel, FormControl, FormGroup, Image } from 'react-bootstrap';

export interface IProps {
  onClose: () => void;
  userInfo: IValidateKeyData;
}

interface ILoginFormState {
  APIKey: string;
  isSubmitted: boolean;
  userId: string;
  name: string;
  email: string;
  statusCode: string;
  statusCodeMessage: string;
  isPremium: boolean;
  isSupporter: boolean;
  profileUrl: string;
}

interface IConnectedProps {
  APIKey: string;
}

interface IActionProps {
  onSetAPIKey: (APIKey: string) => void;
  onShowLoginError: (message: string) => void;
}

interface IValidationState {
  state?: 'success' | 'warning' | 'error';
  reason?: string;
  pending?: boolean;
}

type ILoginFormProps = IProps & IConnectedProps & IActionProps;

class LoginForm extends ComponentEx<ILoginFormProps, ILoginFormState> {
  constructor(props) {
    super(props);
    this.state = {
      APIKey: '',
      isSubmitted: false,
      userId: '',
      name: '',
      email: '',
      statusCode: null,
      statusCodeMessage: '',
      isPremium: false,
      isSupporter: false,
      profileUrl: '',
    };
  }

  public componentWillMount() {
    if (this.props.userInfo !== undefined) {
      this.initUserInfo(this.props);
    }
  }

  public componentWillReceiveProps(nextProps: IProps) {
    this.initUserInfo(nextProps);
  }

  public render(): JSX.Element {
    const { APIKey } = this.props;
    const propAPIKey = this.props.APIKey;

    return (
      <form onSubmit={this.apiKeySubmit} >
        {APIKey === undefined ? this.renderKeyInput() : this.renderAccountInfo()}
        {this.renderSubmitButton(propAPIKey)}
      </form>
    );
  }

  private renderKeyInput() {
    const { t } = this.props;
    const { APIKey } = this.state;

    const validation: IValidationState = this.validationState();
    return (
      <FormGroup
        controlId='formAPIKeyValidation'
        validationState={validation.state}
      >
        <ControlLabel>{validation.reason}</ControlLabel>
        <textarea
          name='APIKey'
          style={{ resize: 'none', width: '100%' }}
          rows={4}
          value={APIKey}
          placeholder={t('Create an API key on www.nexusmods.com and paste it here')}
          onChange={this.handleChangeAPIKey}
        />
        <FormFeedbackAwesome pending={validation.pending} />
      </FormGroup>
    );
  }

  private renderAccountInfo() {
    const { t } = this.props;
    const { name, email, isPremium, isSupporter, profileUrl, userId } = this.state;

    return (
      <FormGroup
        controlId='formUserInfo'
      >
        <div>
          <Image src={profileUrl} width='90' height='90' rounded />
        </div>
        <div>
          <ControlLabel>{t('User ID: {{userId}}', { replace: { userId } })}</ControlLabel>
        </div>
        <div>
          <ControlLabel>{t('UserName: {{name}}', { replace: { name } })}</ControlLabel>
        </div>
        <div>
          <ControlLabel>{
            t('Premium: {{isPremium}}',
              { replace: { isPremium: (isPremium ? t('YES') : t('NO')) } })
          } </ControlLabel>
        </div>
        <div>
          <ControlLabel>{
            t('Supporter: {{isSupporter}}',
              { replace: { isSupporter: (isSupporter ? t('YES') : t('NO')) } })
          }</ControlLabel>
        </div>
        <div>
          <ControlLabel>{t('Email: {{email}}', { replace: { email } })}</ControlLabel>
        </div>
      </FormGroup>
    );
  }

  private renderSubmitButton(propAPIKey: string): JSX.Element {
    const { t } = this.props;
    return (propAPIKey === undefined)
      ? (
        <Button id='submit-apikey' type='submit' tooltip={t('Submit')}>
          {t('Submit')}
        </Button>
      )
      : (
        <Button id='remove-apikey' type='submit' tooltip={t('Remove Key')}>
          {t('Remove Key')}
        </Button>
      );
  }

  private handleChange(event, field) {
    this.setState(update(this.state, { [field]: { $set: event.target.value } }));
  }

  private validationState(): IValidationState {
    const { isSubmitted, APIKey, statusCode, statusCodeMessage } = this.state;

    if (!isSubmitted) {
      return {};
    }
    if (APIKey.length === 0) {
      return { state: 'warning', reason: 'Missing API Key' };
    }
    if (statusCode === null) {
      return { pending: true, reason: 'Verifying...' };
    }
    if (statusCode !== '200') {
      return { state: 'warning', reason: statusCodeMessage };
    }

    return { state: 'success' };
  }

  private apiKeySubmit = (event) => {
    event.preventDefault();
    this.authenticateAPIKey();
  }

  private authenticateAPIKey() {
    const { onSetAPIKey } = this.props;
    const { APIKey } = this.state;
    const propAPIKey = this.props.APIKey;

    if (propAPIKey !== undefined) {
      onSetAPIKey(undefined);
      this.setState(update(this.state, { isSubmitted: { $set: false } }));
    } else {
      this.setState(update(this.state, {
        isSubmitted: { $set: true },
        statusCode: { $set: null },
        statusCodeMessage: { $set: '' },
      }));
      if (APIKey !== '') {
        onSetAPIKey(APIKey);
      }
    }
  }

  private initUserInfo(props: IProps) {
    const { userInfo } = props;
    if (userInfo === undefined) {
      return;
    }
    this.setState(update(this.state, {
      userId: { $set: userInfo.userId },
      name: { $set: userInfo.name },
      isPremium: { $set: userInfo.isPremium },
      isSupporter: { $set: userInfo.isSupporter },
      email: { $set: userInfo.email },
      profileUrl: { $set: userInfo.profileUrl },
    }));
  }

  private handleChangeAPIKey = (event) => {
    this.setState(update(this.state, { statusCode: { $set: '' } }));
    this.setState(update(this.state, { statusCodeMessage: { $set: '' } }));
    this.handleChange(event, 'APIKey');
  }
}

function mapStateToProps(state: any): IConnectedProps {
  return {
    APIKey: getSafe(state, ['confidential', 'account', 'nexus', 'APIKey'], undefined),
  };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<any>): IActionProps {
  return {
    onSetAPIKey: (APIKey: string) => dispatch(setUserAPIKey(APIKey)),
    onShowLoginError:
    (message: string) => dispatch(showDialog('error', 'Error', { message }, { Close: null })),
  };
}

export default
  translate(['common'], { wait: false })(
    connect(mapStateToProps, mapDispatchToProps)(LoginForm),
  ) as React.ComponentClass<IProps>;
