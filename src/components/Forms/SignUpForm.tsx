import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Box,
  Divider,
  AbsoluteCenter,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import React from 'react';
import { useTranslation } from 'next-i18next';
import SVGIcon from '../Icons/SVGIcon';
import GoogleIcon from '@/assets/svgs/google-icon.svg';
import BaseForm from './BaseForm';
import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { SignUpDto } from '@/dtos/authDto';
import { useToast } from '@chakra-ui/react';
import authApi from '@/apis/authApi';
import { useDispatch, useSelector } from 'react-redux';
import { updateInfo } from '@/redux/slice/authSlice';
import { authSelector } from '@/redux/selector';

interface SignUpFormProps {
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
}

export default function SignUpForm(props: SignUpFormProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const authPayload = useSelector(authSelector);
  const dispatch = useDispatch();
  const toast = useToast();
  const { t } = useTranslation('auth');
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t('validation.fullNameRequired')),
      email: Yup.string()
        .email(t('validation.invalidEmail'))
        .required(t('validation.emailRequired')),
      password: Yup.string()
        .min(6, t('validation.passwordMinLength'))
        .required(t('validation.passwordRequired')),
    }),
    onSubmit: (values, actions) => {},
  });
  const handleSignUp = useMutation({
    mutationFn: async (payload: SignUpDto) => {
      return await authApi.signUp(payload);
    },
    onSuccess: () => {
      toast({
        title: t('messages.registerSuccess'),
        status: 'success',
        position: 'top-right',
        duration: 1000,
        isClosable: true,
      });
      dispatch(updateInfo(formik.values));
      props.setActiveStep(2);
    },
    onError: () => {
      toast({
        title: t('messages.formErrors'),
        status: 'error',
        position: 'top-right',
        duration: 1000,
        isClosable: true,
      });
    },
  });
  React.useEffect(() => {
    const { email, password, name } = authPayload;
    if (email && password && name) {
      formik.setValues({ email, password, name });
    }
  }, []);

  const handleSigninWithGoogle = async () => {
    window.open(
      `${process.env.NEXT_PUBLIC_DEV_API}/auth/google?redirectUrl=${process.env.NEXT_PUBLIC_URL}/auth/login`,
      '_self'
    );
  };

  return (
    <div className="w-40 mb-[80px]">
      <BaseForm>
        <form onSubmit={formik.handleSubmit}>
          <h1 className="text-primary font-bold text-2xl text-center">
            {t('registerForm')}
          </h1>
          {/* Google Button  */}
          <div className="flex justify-center items-center my-[20px]">
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={handleSigninWithGoogle}
              leftIcon={<SVGIcon svgComponent={GoogleIcon} />}
            >
              {t('signUpWithGoogle')}
            </Button>
          </div>
          <Box position="relative" padding="5">
            <Divider />
            <AbsoluteCenter
              px="4"
              className="text-[14px] text-secondary bg-[#fff]"
            >
              {t('orFillInForm')}
            </AbsoluteCenter>
          </Box>
          <FormControl isInvalid={formik.touched.name && !!formik.errors.name}>
            <FormLabel htmlFor="name">{t('fullName')}</FormLabel>
            <Input
              placeholder={t('enterFullName')}
              id="name"
              name="name"
              type="text"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.name && formik.errors.name && (
              <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl
            isInvalid={formik.touched.email && !!formik.errors.email}
          >
            <FormLabel htmlFor="email">{t('emailAddress')}</FormLabel>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder={t('enterEmail')}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.email && formik.errors.email && (
              <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl
            isInvalid={formik.touched.password && !!formik.errors.password}
          >
            <FormLabel htmlFor="password">{t('password')}</FormLabel>
            <InputGroup>
              <Input
                type={isVisible ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder={t('enterPassword')}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <InputRightElement onClick={() => setIsVisible(!isVisible)}>
                {isVisible ? (
                  <ViewIcon
                    color="gray.400"
                    boxSize={5}
                    className="hover:opacity-50 hover:cursor-pointer"
                  />
                ) : (
                  <ViewOffIcon
                    color="gray.400"
                    boxSize={5}
                    className="hover:opacity-50 hover:cursor-pointer"
                  />
                )}
              </InputRightElement>
            </InputGroup>
            {formik.touched.password && formik.errors.password && (
              <FormErrorMessage>{formik.errors.password}</FormErrorMessage>
            )}
          </FormControl>
          {/* Sign In Button */}
          <Button
            className="w-full mt-[20px]"
            colorScheme="teal"
            variant="solid"
            isLoading={handleSignUp.isPending}
            onClick={() => {
              handleSignUp.mutate(formik.values);
            }}
          >
            {t('signUp')}
          </Button>
          <div className="text-center mt-[10px]">
            {t('alreadyHaveAccount')}{' '}
            <Link className="text-primary" href="/auth/login">
              {t('signInQuestion')}
            </Link>
          </div>
        </form>
      </BaseForm>
    </div>
  );
}
