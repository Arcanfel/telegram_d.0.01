var SiteContent = React.createClass({displayName: "SiteContent",
	propTypes: {
		state: React.PropTypes.oneOf("empty", "loading", "non-empty").isRequired,
		message: React.PropTypes.string
	},
	getDefaultProps: function getDefaultProps() {
		return {
			state: "empty",
			message: "Дуда пидор!"
		}
	},
	render: function render() {
		return (
			React.createElement("div", {id: "site_content"}, 
				React.createElement("h1", null, this.props.message)
			)
		);
	}
});