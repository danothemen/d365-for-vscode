import React, {Component} from 'react'
class DynamicsFile extends Component{
    render(){
        return (
            <div>
                <div>{this.props.name}{this.props.displayname != null ? (" | "+this.props.displayname) : ""}</div>
            </div>
        );
    }
}
class DynamicsFileList extends Component{
    constructor(props) {
        super(props);
        // This binding is necessary to make `this` work in the callback
        this.HandleCheckboxChange = this.HandleCheckboxChange.bind(this);
        this.FilterChange = this.FilterChange.bind(this);
      }
    componentWillMount(){
        this.state = {
            showHtml:true,
            showJS: true,
            showCSS: true,
            showXML: true,
            prefix:null
        };
    }
    componentDidMount(){
        this.setState({
            showHtml:true,
            showJS: true,
            showCSS: true,
            showXML: true
        });
    }
    //show only checked file types
    HandleCheckboxChange(e){
        console.log(e.target);
        this.state[e.target.getAttribute("name")] = e.target.checked;
        this.setState(this.state);
        console.log(this.state);
    }
    FilterChange(e){
        console.log(e.target);
        if(e.target.value.trim() != ''){
            this.state.prefix = e.target.value;
        }
        else{
            this.state.prefix = null;
        }
        this.setState(this.state);
        console.log(this.state);
    }
    render(){
        console.log("Rendering Files");
        return (
            <div >
                <div className="d365filefilters">
                    <div>JS
                        <input onChange={this.HandleCheckboxChange} name="showJS" checked={this.state.showJS} type="checkbox"/>
                    </div>
                    <div>HTML
                        <input onChange={this.HandleCheckboxChange} name="showHtml" checked={this.state.showHtml} type="checkbox"/>
                    </div>
                    <div>CSS
                        <input onChange={this.HandleCheckboxChange} name="showCSS" checked={this.state.showCSS} type="checkbox"/>
                    </div>
                    <div>XML
                        <input onChange={this.HandleCheckboxChange} name="showXML" checked={this.state.showXML} type="checkbox"/>
                    </div>
                </div>
                <div>
                    <input type="text" placeholder="Prefix" onChange={this.FilterChange} />
                </div>
                <div>
                    {this.props.resources
                    .filter(res =>{
                        let matchesPrefix = true;
                        if(this.state.prefix != null){
                            matchesPrefix = res.name.startsWith(this.state.prefix);
                        }
                        //only show web resources that are HTML, CSS, XML or JS
                        return ((res.webresourcetype == 1 && this.state.showHtml) || 
                        (res.webresourcetype == 2 && this.state.showCSS) || 
                        (res.webresourcetype == 3 && this.state.showJS) || 
                        (res.webresourcetype == 4 && this.state.showXML)) && matchesPrefix;
                    })
                    .map(res => {
                        //display dynamics files alongside ondisk files
                        return <DynamicsFile name={res.name} displayname={res.displayname} id={res.webresourceid}/>
                    })}
                </div>
            </div>
        );
    }
}

export default DynamicsFileList