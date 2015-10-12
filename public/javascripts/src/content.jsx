var SiteContent = React.createClass({
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
			<div id="site_content">
				<h1>{this.props.message}</h1>
			</div>
		);
	}
});