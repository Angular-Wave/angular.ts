/\*\*

- @ngdoc module
- @name ngMessages
- @description
-
- The `ngMessages` module provides enhanced support for displaying messages within templates
- (typically within forms or when rendering message objects that return key/value data).
- Instead of relying on JavaScript code and/or complex ng-if statements within your form template to
- show and hide error messages specific to the state of an input field, the `ngMessages` and
- `ngMessage` directives are designed to handle the complexity, inheritance and priority
- sequencing based on the order of how the messages are defined in the template.
-
- Currently, the ngMessages module only contains the code for the `ngMessages`, `ngMessagesInclude`
- `ngMessage`, `ngMessageExp` and `ngMessageDefault` directives.
-
- ## Usage
- The `ngMessages` directive allows keys in a key/value collection to be associated with a child element
- (or 'message') that will show or hide based on the truthiness of that key's value in the collection. A common use
- case for `ngMessages` is to display error messages for inputs using the `$error` object exposed by the
- {@link ngModel ngModel} directive.
-
- The child elements of the `ngMessages` directive are matched to the collection keys by a `ngMessage` or
- `ngMessageExp` directive. The value of these attributes must match a key in the collection that is provided by
- the `ngMessages` directive.
-
- Consider the following example, which illustrates a typical use case of `ngMessages`. Within the form `myForm` we
- have a text input named `myField` which is bound to the scope variable `field` using the {@link ngModel ngModel}
- directive.
-
- The `myField` field is a required input of type `email` with a maximum length of 15 characters.
-
- ```html

  ```

- <form name="myForm">
- <label>
-     Enter text:
-     <input type="email" ng-model="field" name="myField" required maxlength="15" />
- </label>
- <div ng-messages="myForm.myField.$error" role="alert">
-     <div ng-message="required">Please enter a value for this field.</div>
-     <div ng-message="email">This field must be a valid email address.</div>
-     <div ng-message="maxlength">This field can be at most 15 characters long.</div>
- </div>
- </form>
- ```

  ```

-
- In order to show error messages corresponding to `myField` we first create an element with an `ngMessages` attribute
- set to the `$error` object owned by the `myField` input in our `myForm` form.
-
- Within this element we then create separate elements for each of the possible errors that `myField` could have.
- The `ngMessage` attribute is used to declare which element(s) will appear for which error - for example,
- setting `ng-message="required"` specifies that this particular element should be displayed when there
- is no value present for the required field `myField` (because the key `required` will be `true` in the object
- `myForm.myField.$error`).
-
- ### Message order
-
- By default, `ngMessages` will only display one message for a particular key/value collection at any time. If more
- than one message (or error) key is currently true, then which message is shown is determined by the order of messages
- in the HTML template code (messages declared first are prioritised). This mechanism means the developer does not have
- to prioritize messages using custom JavaScript code.
-
- Given the following error object for our example (which informs us that the field `myField` currently has both the
- `required` and `email` errors):
-
- ```javascript

  ```

- <!-- keep in mind that ngModel automatically sets these error flags -->
- myField.$error = { required : true, email: true, maxlength: false };
- ```

  ```

- The `required` message will be displayed to the user since it appears before the `email` message in the DOM.
- Once the user types a single character, the `required` message will disappear (since the field now has a value)
- but the `email` message will be visible because it is still applicable.
-
- ### Displaying multiple messages at the same time
-
- While `ngMessages` will by default only display one error element at a time, the `ng-messages-multiple` attribute can
- be applied to the `ngMessages` container element to cause it to display all applicable error messages at once:
-
- ```html

  ```

- <!-- attribute-style usage -->
- <div ng-messages="myForm.myField.$error" ng-messages-multiple>...</div>
-
- <!-- element-style usage -->
- <ng-messages for="myForm.myField.$error" multiple>...</ng-messages>
- ```

  ```

-
- ## Reusing and Overriding Messages
- In addition to prioritization, ngMessages also allows for including messages from a remote or an inline
- template. This allows for generic collection of messages to be reused across multiple parts of an
- application.
-
- ```html

  ```

- <script type="text/ng-template" id="error-messages">
- <div ng-message="required">This field is required</div>
- <div ng-message="minlength">This field is too short</div>
- </script>
-
- <div ng-messages="myForm.myField.$error" role="alert">
- <div ng-messages-include="error-messages"></div>
- </div>
- ```

  ```

-
- However, including generic messages may not be useful enough to match all input fields, therefore,
- `ngMessages` provides the ability to override messages defined in the remote template by redefining
- them within the directive container.
-
- ```html

  ```

- <!-- a generic template of error messages known as "my-custom-messages" -->
- <script type="text/ng-template" id="my-custom-messages">
- <div ng-message="required">This field is required</div>
- <div ng-message="minlength">This field is too short</div>
- </script>
-
- <form name="myForm">
- <label>
-     Email address
-     <input type="email"
-            id="email"
-            name="myEmail"
-            ng-model="email"
-            minlength="5"
-            required />
- </label>
- <!-- any ng-message elements that appear BEFORE the ng-messages-include will
-        override the messages present in the ng-messages-include template -->
- <div ng-messages="myForm.myEmail.$error" role="alert">
-     <!-- this required message has overridden the template message -->
-     <div ng-message="required">You did not enter your email address</div>
-
-     <!-- this is a brand new message and will appear last in the prioritization -->
-     <div ng-message="email">Your email address is invalid</div>
-
-     <!-- and here are the generic error messages -->
-     <div ng-messages-include="my-custom-messages"></div>
- </div>
- </form>
- ```

  ```

-
- In the example HTML code above the message that is set on required will override the corresponding
- required message defined within the remote template. Therefore, with particular input fields (such
- email addresses, date fields, autocomplete inputs, etc...), specialized error messages can be applied
- while more generic messages can be used to handle other, more general input errors.
-
- ## Dynamic Messaging
- ngMessages also supports using expressions to dynamically change key values. Using arrays and
- repeaters to list messages is also supported. This means that the code below will be able to
- fully adapt itself and display the appropriate message when any of the expression data changes:
-
- ```html

  ```

- <form name="myForm">
- <label>
-     Email address
-     <input type="email"
-            name="myEmail"
-            ng-model="email"
-            minlength="5"
-            required />
- </label>
- <div ng-messages="myForm.myEmail.$error" role="alert">
-     <div ng-message="required">You did not enter your email address</div>
-     <div ng-repeat="errorMessage in errorMessages">
-       <!-- use ng-message-exp for a message whose key is given by an expression -->
-       <div ng-message-exp="errorMessage.type">{{ errorMessage.text }}</div>
-     </div>
- </div>
- </form>
- ```

  ```

-
- The `errorMessage.type` expression can be a string value or it can be an array so
- that multiple errors can be associated with a single error message:
-
- ```html

  ```

- <label>
-     Email address
-     <input type="email"
-            ng-model="data.email"
-            name="myEmail"
-            ng-minlength="5"
-            ng-maxlength="100"
-            required />
- </label>
- <div ng-messages="myForm.myEmail.$error" role="alert">
-     <div ng-message-exp="'required'">You did not enter your email address</div>
-     <div ng-message-exp="['minlength', 'maxlength']">
-       Your email must be between 5 and 100 characters long
-     </div>
- </div>
- ```

  ```

-
- Feel free to use other structural directives such as ng-if and ng-switch to further control
- what messages are active and when. Be careful, if you place ng-message on the same element
- as these structural directives, AngularJS may not be able to determine if a message is active
- or not. Therefore it is best to place the ng-message on a child element of the structural
- directive.
-
- ```html

  ```

- <div ng-messages="myForm.myEmail.$error" role="alert">
- <div ng-if="showRequiredError">
-     <div ng-message="required">Please enter something</div>
- </div>
- </div>
- ```

  ```

-
- ## Animations
- If the `ngAnimate` module is active within the application then the `ngMessages`, `ngMessage` and
- `ngMessageExp` directives will trigger animations whenever any messages are added and removed from
- the DOM by the `ngMessages` directive.
-
- Whenever the `ngMessages` directive contains one or more visible messages then the `.ng-active` CSS
- class will be added to the element. The `.ng-inactive` CSS class will be applied when there are no
- messages present. Therefore, CSS transitions and keyframes as well as JavaScript animations can
- hook into the animations whenever these classes are added/removed.
-
- Let's say that our HTML code for our messages container looks like so:
-
- ```html

  ```

- <div ng-messages="myMessages" class="my-messages" role="alert">
- <div ng-message="alert" class="some-message">...</div>
- <div ng-message="fail" class="some-message">...</div>
- </div>
- ```

  ```

-
- Then the CSS animation code for the message container looks like so:
-
- ```css

  ```

- .my-messages {
- transition:1s linear all;
- }
- .my-messages.ng-active {
- // messages are visible
- }
- .my-messages.ng-inactive {
- // messages are hidden
- }
- ```

  ```

-
- Whenever an inner message is attached (becomes visible) or removed (becomes hidden) then the enter
- and leave animation is triggered for each particular element bound to the `ngMessage` directive.
-
- Therefore, the CSS code for the inner messages looks like so:
-
- ```css

  ```

- .some-message {
- transition:1s linear all;
- }
-
- .some-message.ng-enter {}
- .some-message.ng-enter.ng-enter-active {}
-
- .some-message.ng-leave {}
- .some-message.ng-leave.ng-leave-active {}
- ```

  ```

-
- {@link ngAnimate See the ngAnimate docs} to learn how to use JavaScript animations or to learn
- more about ngAnimate.
-
- ## Displaying a default message
- If the ngMessages renders no inner ngMessage directive (i.e. when none of the truthy
- keys are matched by a defined message), then it will render a default message
- using the {@link ngMessageDefault} directive.
- Note that matched messages will always take precedence over unmatched messages. That means
- the default message will not be displayed when another message is matched. This is also
- true for `ng-messages-multiple`.
-
- ```html

  ```

- <div ng-messages="myForm.myField.$error" role="alert">
- <div ng-message="required">This field is required</div>
- <div ng-message="minlength">This field is too short</div>
- <div ng-message-default>This field has an input error</div>
- </div>
- ```

  ```

- \*/

  /\*\*
  _ @ngdoc directive
  _ @module ngMessages
  _ @name ngMessages
  _ @restrict AE \*
  _ @description
  _ `ngMessages` is a directive that is designed to show and hide messages based on the state
  _ of a key/value object that it listens on. The directive itself complements error message
  _ reporting with the `ngModel` $error object (which stores a key/value state of validation errors).

  -
  - `ngMessages` manages the state of internal messages within its container element. The internal
  - messages use the `ngMessage` directive and will be inserted/removed from the page depending
  - on if they're present within the key/value object. By default, only one message will be displayed
  - at a time and this depends on the prioritization of the messages within the template. (This can
  - be changed by using the `ng-messages-multiple` or `multiple` attribute on the directive container.)
  -
  - A remote template can also be used (With {@link ngMessagesInclude}) to promote message
  - reusability and messages can also be overridden.
  -
  - A default message can also be displayed when no `ngMessage` directive is inserted, using the
  - {@link ngMessageDefault} directive.
  -
  - {@link module:ngMessages Click here} to learn more about `ngMessages` and `ngMessage`.
  -
  - @usage
  - ```html

    ```

  - <!-- using attribute directives -->
  - <ANY ng-messages="expression" role="alert">
  - <ANY ng-message="stringValue">...</ANY>
  - <ANY ng-message="stringValue1, stringValue2, ...">...</ANY>
  - <ANY ng-message-exp="expressionValue">...</ANY>
  - <ANY ng-message-default>...</ANY>
  - </ANY>
  -
  - <!-- or by using element directives -->
  - <ng-messages for="expression" role="alert">
  - <ng-message when="stringValue">...</ng-message>
  - <ng-message when="stringValue1, stringValue2, ...">...</ng-message>
  - <ng-message when-exp="expressionValue">...</ng-message>
  - <ng-message-default>...</ng-message-default>
  - </ng-messages>
  - ```

    ```

  -
  - @param {string} ngMessages an AngularJS expression evaluating to a key/value object
  -                 (this is typically the $error object on an ngModel instance).
  - @param {string=} ngMessagesMultiple|multiple when set, all messages will be displayed with true
  -
  - @example
  - <example name="ngMessages-directive" module="ngMessagesExample"
  -          deps="angular-messages.js"
  -          animations="true" fixBase="true">
  - <file name="index.html">
  -     <form name="myForm">
  -       <label>
  -         Enter your name:
  -         <input type="text"
  -                name="myName"
  -                ng-model="name"
  -                ng-minlength="5"
  -                ng-maxlength="20"
  -                required />
  -       </label>
  -       <pre>myForm.myName.$error = {{ myForm.myName.$error | json }}</pre> \*
    _ <div ng-messages="myForm.myName.$error" style="color:maroon" role="alert">
    _ <div ng-message="required">You did not enter a field</div>
    _ <div ng-message="minlength">Your field is too short</div>
    _ <div ng-message="maxlength">Your field is too long</div>
    _ <div ng-message-default>This field has an input error</div>
    _ </div>
    _ </form>
    _ </file>
    _ <file name="script.js">
    _ angular.module('ngMessagesExample', ['ngMessages']);
    _ </file>
    _ </example>
    \*/

  /\*\*
  _ @ngdoc directive
  _ @name ngMessagesInclude
  _ @restrict AE
  _ @scope \*
  _ @description
  _ `ngMessagesInclude` is a directive with the purpose to import existing ngMessage template
  _ code from a remote template and place the downloaded template code into the exact spot
  _ that the ngMessagesInclude directive is placed within the ngMessages container. This allows
  _ for a series of pre-defined messages to be reused and also allows for the developer to
  _ determine what messages are overridden due to the placement of the ngMessagesInclude directive. \*
  _ @usage
  _ `html

  - <!-- using attribute directives -->
  - <ANY ng-messages="expression" role="alert">
  - <ANY ng-messages-include="remoteTplString">...</ANY>
  - </ANY>
  -
  - <!-- or by using element directives -->
  - <ng-messages for="expression" role="alert">
  - <ng-messages-include src="expressionValue1">...</ng-messages-include>
  - </ng-messages>
  - `\*
_ {@link module:ngMessages Click here} to learn more about`ngMessages`and`ngMessage`.
    \_
    _ @param {string} ngMessagesInclude|src a string value corresponding to the remote template.
    _/

  /\*\*
  _ @ngdoc directive
  _ @name ngMessage
  _ @restrict AE
  _ @scope
  _ @priority 1
  _
  _ @description
  _ `ngMessage` is a directive with the purpose to show and hide a particular message.
  _ For `ngMessage` to operate, a parent `ngMessages` directive on a parent DOM element
  _ must be situated since it determines which messages are visible based on the state
  _ of the provided key/value map that `ngMessages` listens on.
  _
  _ More information about using `ngMessage` can be found in the
  _ {@link module:ngMessages `ngMessages` module documentation}. \*
  _ @usage
  _ `html

  - <!-- using attribute directives -->
  - <ANY ng-messages="expression" role="alert">
  - <ANY ng-message="stringValue">...</ANY>
  - <ANY ng-message="stringValue1, stringValue2, ...">...</ANY>
  - </ANY>
  -
  - <!-- or by using element directives -->
  - <ng-messages for="expression" role="alert">
  - <ng-message when="stringValue">...</ng-message>
  - <ng-message when="stringValue1, stringValue2, ...">...</ng-message>
  - </ng-messages>
  - ` \*
    _ @param {string} ngMessage|when a string value corresponding to the message key.
    _/

  /\*\*
  _ @ngdoc directive
  _ @name ngMessageExp
  _ @restrict AE
  _ @priority 1
  _ @scope
  _
  _ @description
  _ `ngMessageExp` is the same as {@link directive:ngMessage `ngMessage`}, but instead of a static
  _ value, it accepts an expression to be evaluated for the message key.
  _
  _ @usage
  _ `html

  - <!-- using attribute directives -->
  - <ANY ng-messages="expression">
  - <ANY ng-message-exp="expressionValue">...</ANY>
  - </ANY>
  -
  - <!-- or by using element directives -->
  - <ng-messages for="expression">
  - <ng-message when-exp="expressionValue">...</ng-message>
  - </ng-messages>
  - `\*
_ {@link module:ngMessages Click here} to learn more about`ngMessages`and`ngMessage`.
    \_
    _ @param {string} ngMessageExp|whenExp an expression value corresponding to the message key.
    _/

                                                                            /**
                                                                            * @ngdoc directive
                                                                            * @name ngMessageDefault
                                                                            * @restrict AE
                                                                            * @scope
                                                                            *
                                                                            * @description
                                                                            * `ngMessageDefault` is a directive with the purpose to show and hide a default message for
                                                                            * {@link directive:ngMessages}, when none of provided messages matches.
                                                                            *
                                                                            * More information about using `ngMessageDefault` can be found in the
                                                                            * {@link module:ngMessages `ngMessages` module documentation}.
                                                                            *
                                                                            * @usage
                                                                            * ```html
                                                                            * <!-- using attribute directives -->
                                                                            * <ANY ng-messages="expression" role="alert">
                                                                            *   <ANY ng-message="stringValue">...</ANY>
                                                                            *   <ANY ng-message="stringValue1, stringValue2, ...">...</ANY>
                                                                            *   <ANY ng-message-default>...</ANY>
                                                                            * </ANY>
                                                                            *
                                                                            * <!-- or by using element directives -->
                                                                            * <ng-messages for="expression" role="alert">
                                                                            *   <ng-message when="stringValue">...</ng-message>
                                                                            *   <ng-message when="stringValue1, stringValue2, ...">...</ng-message>
                                                                            *   <ng-message-default>...</ng-message-default>
                                                                            * </ng-messages>
                                                                            *
                                                                            */
