import CodeViewer from "@/components/CodeViewer/CodeViewer";
import DocumentTemplateList from "@/pages/document-template";
import { Button, Modal, ModalCloseButton, ModalContent, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export interface DisplayRobotCodeParams {
    compileRobotCode: any;
    errorTrace?: string;
    setErrorTrace: any;
    isOpen?: boolean;
    onClose?: () => void;
}
export default function DisplayRobotCode(props: DisplayRobotCodeParams) {
    const {compileRobotCode, errorTrace, setErrorTrace, isOpen: isOpenProp, onClose: onCloseProp} = props
    const [displayTxt, setDisplayTxt] = useState<string>()
    const { isOpen: isOpenInternal, onOpen, onClose: onCloseInternal } = useDisclosure()
    
    const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenInternal;
    const onClose = onCloseProp || onCloseInternal;

    // Auto open modal when component mounts or when props change
    useEffect(() => {
        const result: any = compileRobotCode();
        if(errorTrace && errorTrace.length > 0) {
            setDisplayTxt(errorTrace);
        } else {
            setDisplayTxt(JSON.stringify(result?.code ?? "", null, 4));
        }
        
        // Auto open if using internal state
        if (isOpenProp === undefined) {
            onOpen();
        }
    }, [errorTrace, isOpenProp]);
    
    const handleDisplayRobotCode = () => {
        const result: any = compileRobotCode()
        if(errorTrace && errorTrace.length > 0) {
            setDisplayTxt(errorTrace)
        }   
        else {
            setDisplayTxt(JSON.stringify(result?.code ?? "", null, 4))
        }
        onOpen()
    }

    const onCloseDisplay = () => {
        setErrorTrace('')
        onClose();
    }

    return(
        <>
            <Modal isOpen={isOpen} onClose={onCloseDisplay} size="xl">
                <ModalOverlay />
                <ModalContent maxW="50%">
                    <ModalCloseButton />
                        <CodeViewer
                            code={displayTxt}
                            language="json"
                        >
                        </CodeViewer>
                </ModalContent>
            </Modal>
        </>
    )
}