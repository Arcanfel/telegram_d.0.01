var NavigationItem = React.createClass({	
	render: function render() {
		return (
			<li className="navigation_item">
				{this.props.data.name}
			</li>
		);
	}
});

var NavigationList = React.createClass({
	getInitialState: function() {
		return {
			data: []
		}
	},
	componentDidMount: function() {
		var xmlhttp  = new XMLHttpRequest();
		var callback = this.receiveNavigationData;
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
				callback(xmlhttp.responseText);
			}
		}
		xmlhttp.open("GET", "/api/navigation", true);
		xmlhttp.send();
	},
	receiveNavigationData: function(data) {
		var jsonData = JSON.parse(data);
	
		this.setState({
			data: jsonData
		});
	},
	render: function render() {
		var navigationItems = this.state.data.map(function (itemData, index) {
			return (
				<NavigationItem key={index} data={itemData} />
			);
		});
		return (
			<ul className="navigation_list">
				{navigationItems}
			</ul>
		);
	}
});